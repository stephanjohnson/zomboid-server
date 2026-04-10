// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import TelemetryAutomationStudio from '../../app/components/telemetry-studio/TelemetryAutomationStudio.vue'

import {
  automationStudioVersion,
  createAutomationActionNode,
  createAutomationConditionNode,
  createAutomationBlueprintGraph,
  createBlankAutomationGraph,
  createAutomationPredicate,
  createAutomationTriggerNode,
  normalizeAutomationStudioDocument,
} from '../../shared/telemetry-automation'
import {
  automationRuntimeFlagMutationKey,
  automationRuntimeInGameXpGrantKey,
  automationRuntimeItemGrantKey,
  automationRuntimeMetadataKey,
  automationRuntimePredicateKey,
} from '../../shared/telemetry-automation-runtime'
import { compileAutomationStudioDocument } from '../../server/utils/telemetry-automation-compiler'

const passthroughStub = defineComponent({
  template: '<div><slot /></div>',
})

const canvasStub = defineComponent({
  props: {
    graphName: {
      type: String,
      required: false,
      default: '',
    },
    nodes: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  template: '<div data-test="designer-canvas">{{ graphName }} :: {{ nodes.length }}</div>',
})

const sidebarStub = defineComponent({
  emits: ['add-node'],
  template: '<button data-test="add-node" type="button" @click="$emit(\'add-node\', { type: \'' + 'action-assign-cash' + '\' })">Add node</button>',
})

describe('telemetry automation helpers', () => {
  it('creates a blank graph scaffold with explicit trigger, condition, and action nodes', () => {
    const graph = createBlankAutomationGraph()

    expect(graph.nodes.map(node => node.type)).toEqual(['trigger-item-found', 'condition', 'action-assign-cash'])
    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[1]).toMatchObject({
      sourceHandle: 'true',
      label: 'true',
    })
  })

  it('creates a first-pickup blueprint with a flag gate and explicit set-flag action node', () => {
    const graph = createAutomationBlueprintGraph('first-pickup-bonus')

    expect(graph.name).toBe('First pickup bonus')
    expect(graph.nodes.some(node => node.type === 'condition' && node.data.checks.some(check => check.source === 'flag'))).toBe(true)
    expect(graph.nodes.some(node => node.type === 'action-set-flag')).toBe(true)
  })

  it('normalizes legacy generic trigger and action nodes into explicit node types', () => {
    const document = normalizeAutomationStudioDocument({
      version: 1,
      graphs: [
        {
          name: 'Legacy graph',
          nodes: [
            {
              id: 'legacy-trigger',
              type: 'trigger',
              label: 'Old trigger',
              position: { x: 40, y: 12 },
              data: {
                eventKey: 'pz.zombie.kill',
                dedupeKey: 'kill.count',
              },
            },
            {
              id: 'legacy-action',
              type: 'action',
              label: 'Old action',
              position: { x: 320, y: 12 },
              data: {
                actionKind: 'setFlag',
                targetScope: 'player',
                flagKey: 'reward.legacy',
              },
            },
          ],
          edges: [
            {
              source: 'legacy-trigger',
              target: 'legacy-action',
            },
          ],
        },
      ],
    })

    expect(document.graphs[0]?.nodes[0]).toMatchObject({
      type: 'trigger-zombie-kill',
      data: {
        dedupeKey: 'kill.count',
      },
    })
    expect(document.graphs[0]?.nodes[1]).toMatchObject({
      type: 'action-set-flag',
      data: {
        flagKey: 'reward.legacy',
      },
    })
  })

  it('adds a requested node through the studio shell', async () => {
    const baseGraph = createBlankAutomationGraph()

    const Host = defineComponent({
      components: {
        TelemetryAutomationStudio,
      },

      setup() {
        const document = ref({
          version: 1 as const,
          graphs: [baseGraph],
        })

        return { document, graphId: baseGraph.id }
      },

      template: `
        <TelemetryAutomationStudio v-model="document" :graph-id="graphId" />
        <div data-test="node-types">{{ document.graphs[0].nodes.map(node => node.type).join(',') }}</div>
      `,
    })

    const wrapper = mount(Host, {
      global: {
        stubs: {
          Card: passthroughStub,
          CardContent: passthroughStub,
          TelemetryAutomationCanvas: canvasStub,
          TelemetryAutomationSidebar: sidebarStub,
        },
      },
    })

    await wrapper.get('[data-test="add-node"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="node-types"]').text()).toContain('action-assign-cash,action-assign-cash')
    expect(wrapper.get('[data-test="designer-canvas"]').text()).toContain('4')
  })

  it('compiles an enabled graph into generated workflow and action rules', async () => {
    const trigger = createAutomationTriggerNode('trigger-item-found', {
      id: 'trigger-1',
      label: 'Find key',
      data: {
        filters: [createAutomationPredicate({ source: 'item', path: 'fullType', operator: 'equals', value: 'Base.Key1' })],
      },
    })
    const condition = createAutomationConditionNode({
      id: 'condition-1',
      label: 'Objective locked',
      data: {
        checks: [createAutomationPredicate({ source: 'flag', path: 'objective.unlocked', operator: 'isFalse' })],
      },
    })
    const flagAction = createAutomationActionNode('action-set-flag', {
      id: 'action-flag',
      label: 'Unlock objective',
      data: {
        targetScope: 'server',
        flagKey: 'objective.unlocked',
      },
    })
    const settingsAction = createAutomationActionNode('action-update-server-setting', {
      id: 'action-pvp',
      label: 'Enable PvP',
      data: {
        settingKey: 'PVP',
        settingValue: 'true',
        valueType: 'boolean',
        applyMode: 'restart-server',
      },
    })

    const compiled = await compileAutomationStudioDocument({
      version: automationStudioVersion,
      graphs: [{
        id: 'graph-1',
        name: 'Unlock PvP',
        description: 'Enable PvP after the key is found.',
        isEnabled: true,
        nodes: [trigger, condition, flagAction, settingsAction],
        edges: [
          { id: 'edge-1', source: trigger.id, target: condition.id },
          { id: 'edge-2', source: condition.id, target: flagAction.id, sourceHandle: 'true', label: 'true' },
          { id: 'edge-3', source: flagAction.id, target: settingsAction.id },
        ],
      }],
    })

    expect(compiled.workflows).toHaveLength(1)
    expect(compiled.workflows[0]).toMatchObject({
      key: 'automation.graph.graph-1.trigger.trigger-1',
      steps: [{
        stepOrder: 1,
        eventKey: 'pz.item.found',
      }],
    })
    expect(compiled.workflows[0]?.steps[0]?.matchConfig).toMatchObject({
      [automationRuntimePredicateKey]: {
        kind: 'group',
        combinator: 'all',
      },
    })

    expect(compiled.actionRules).toHaveLength(2)
    expect(compiled.actionRules[0]).toMatchObject({
      name: 'Unlock PvP: Unlock objective',
      triggerKey: 'automation.graph.graph-1.trigger.trigger-1',
      config: {
        [automationRuntimeMetadataKey]: {
          graphId: 'graph-1',
          actionNodeId: 'action-flag',
          executionOrder: 1,
        },
        [automationRuntimeFlagMutationKey]: {
          operation: 'set',
          targetScope: 'server',
          flagKey: 'objective.unlocked',
        },
        [automationRuntimePredicateKey]: {
          kind: 'group',
          combinator: 'all',
        },
      },
    })
    expect(compiled.actionRules[1]).toMatchObject({
      name: 'Unlock PvP: Enable PvP',
      config: {
        serverSettings: {
          PVP: true,
        },
        serverSettingsApplyMode: 'restart-server',
      },
    })
  })

  it('compiles direct item and in-game XP actions into runtime config', async () => {
    const trigger = createAutomationTriggerNode('trigger-item-found', {
      id: 'trigger-reward',
      label: 'Find rare loot',
    })
    const lootAction = createAutomationActionNode('action-assign-loot', {
      id: 'action-loot',
      label: 'Grant katana',
      data: {
        targetScope: 'player',
        itemId: 'Base.Katana',
        quantity: 1,
      },
    })
    const xpAction = createAutomationActionNode('action-assign-ingame-xp', {
      id: 'action-xp',
      label: 'Grant axe XP',
      data: {
        targetScope: 'player',
        amount: 5,
        skillKey: 'Axe',
      },
    })

    const compiled = await compileAutomationStudioDocument({
      version: automationStudioVersion,
      graphs: [{
        id: 'graph-reward',
        name: 'Reward graph',
        description: '',
        isEnabled: true,
        nodes: [trigger, lootAction, xpAction],
        edges: [
          { id: 'edge-loot', source: trigger.id, target: lootAction.id },
          { id: 'edge-xp', source: lootAction.id, target: xpAction.id },
        ],
      }],
    })

    expect(compiled.actionRules).toMatchObject([
      {
        name: 'Reward graph: Grant katana',
        config: {
          [automationRuntimeItemGrantKey]: {
            itemId: 'Base.Katana',
            quantity: 1,
          },
        },
      },
      {
        name: 'Reward graph: Grant axe XP',
        config: {
          [automationRuntimeInGameXpGrantKey]: {
            skillKey: 'Axe',
            amount: 5,
          },
        },
      },
    ])
  })

  it('compiles named loot table actions into multiple runtime item grants', async () => {
    const trigger = createAutomationTriggerNode('trigger-item-found', {
      id: 'trigger-bundle',
      label: 'Find rare loot',
    })
    const lootAction = createAutomationActionNode('action-assign-loot', {
      id: 'action-loot-table',
      label: 'Grant loot table',
      data: {
        targetScope: 'player',
        lootTableId: 'starter.weapons',
        quantity: 2,
      },
    })

    const compiled = await compileAutomationStudioDocument({
      version: automationStudioVersion,
      graphs: [{
        id: 'graph-bundle',
        name: 'Bundle graph',
        description: '',
        isEnabled: true,
        nodes: [trigger, lootAction],
        edges: [
          { id: 'edge-bundle', source: trigger.id, target: lootAction.id },
        ],
      }],
    }, {
      resolveNamedLootTable: async (lootTableId) => {
        expect(lootTableId).toBe('starter.weapons')

        return {
          id: 'bundle-1',
          name: 'Starter Weapons',
          slug: 'starter-weapons',
          items: [
            { itemId: 'Base.Bat', quantity: 1 },
            { itemId: 'Base.NailsBox', quantity: 2 },
          ],
        }
      },
    })

    expect(compiled.actionRules).toMatchObject([
      {
        name: 'Bundle graph: Grant loot table',
        config: {
          [automationRuntimeItemGrantKey]: [
            {
              itemId: 'Base.Bat',
              quantity: 2,
            },
            {
              itemId: 'Base.NailsBox',
              quantity: 4,
            },
          ],
        },
      },
    ])
  })

  it('fails compilation when a loot action uses a named loot table without a resolver', async () => {
    const trigger = createAutomationTriggerNode('trigger-item-found', {
      id: 'trigger-unsupported',
      label: 'Find rare loot',
    })
    const action = createAutomationActionNode('action-assign-loot', {
      id: 'action-loot-table',
      label: 'Grant loot table',
      data: {
        targetScope: 'player',
        lootTableId: 'starter.weapons',
        quantity: 1,
      },
    })

    await expect(compileAutomationStudioDocument({
      version: automationStudioVersion,
      graphs: [{
        id: 'graph-unsupported',
        name: 'Unsupported graph',
        description: '',
        isEnabled: true,
        nodes: [trigger, action],
        edges: [
          { id: 'edge-unsupported', source: trigger.id, target: action.id },
        ],
      }],
    })).rejects.toThrow(/no named loot table resolver is configured/i)
  })
})
