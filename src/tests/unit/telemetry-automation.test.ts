// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import TelemetryAutomationStudio from '../../app/components/telemetry-studio/TelemetryAutomationStudio.vue'

import {
  createAutomationBlueprintGraph,
  createBlankAutomationGraph,
  normalizeAutomationStudioDocument,
} from '../../shared/telemetry-automation'

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
})
