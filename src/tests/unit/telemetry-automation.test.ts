// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'

import TelemetryAutomationStudio from '../../app/components/telemetry-studio/TelemetryAutomationStudio.vue'

import {
  createAutomationBlueprintGraph,
  createBlankAutomationGraph,
  createEmptyAutomationStudioDocument,
  normalizeAutomationStudioDocument,
} from '../../shared/telemetry-automation'

const passthroughStub = defineComponent({
  template: '<div><slot /></div>',
})

const buttonStub = defineComponent({
  emits: ['click'],
  template: '<button type="button" @click="$emit(\'click\', $event)"><slot /></button>',
})

const canvasStub = defineComponent({
  props: {
    graphName: {
      type: String,
      required: false,
      default: '',
    },
  },
  template: '<div data-test="designer-canvas">{{ graphName }}</div>',
})

const inspectorStub = defineComponent({
  template: '<div data-test="designer-inspector">Inspector</div>',
})

describe('telemetry automation helpers', () => {
  it('creates a blank graph scaffold with trigger, condition, and action nodes', () => {
    const graph = createBlankAutomationGraph()

    expect(graph.nodes.map(node => node.type)).toEqual(['trigger', 'condition', 'action'])
    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[1]).toMatchObject({
      sourceHandle: 'true',
      label: 'true',
    })
  })

  it('creates a first-pickup blueprint with a flag gate and set-flag action', () => {
    const graph = createAutomationBlueprintGraph('first-pickup-bonus')

    expect(graph.name).toBe('First pickup bonus')
    expect(graph.nodes.some(node => node.type === 'condition' && node.data.checks.some(check => check.source === 'flag'))).toBe(true)
    expect(graph.nodes.some(node => node.type === 'action' && node.data.actionKind === 'setFlag')).toBe(true)
  })

  it('normalizes malformed documents into a stable empty shape', () => {
    const document = normalizeAutomationStudioDocument({
      version: 42,
      graphs: [
        {
          name: 'Broken graph',
          nodes: [
            {
              type: 'condition',
              label: 'Needs defaults',
              position: { x: 'bad', y: 12 },
              data: {
                combinator: 'invalid',
                checks: [{ source: 'flag', path: 'reward.once', operator: 'isFalse' }],
              },
            },
          ],
          edges: [
            {
              source: 'missing-source',
              target: 'missing-target',
            },
          ],
        },
      ],
    })

    expect(document.version).toBe(1)
    expect(document.graphs).toHaveLength(1)
    expect(document.graphs[0]?.name).toBe('Broken graph')
    expect(document.graphs[0]?.nodes[0]).toMatchObject({
      type: 'condition',
      position: { x: 360, y: 12 },
      data: {
        combinator: 'all',
      },
    })
    expect(document.graphs[0]?.edges).toEqual([
      expect.objectContaining({
        source: 'missing-source',
        target: 'missing-target',
      }),
    ])
  })

  it('shows the designer after adding a blank rule graph', async () => {
    const Host = defineComponent({
      components: {
        TelemetryAutomationStudio,
      },

      setup() {
        const document = ref(createEmptyAutomationStudioDocument())
        return { document }
      },

      template: '<TelemetryAutomationStudio v-model="document" profile-name="Test Profile" />',
    })

    const wrapper = mount(Host, {
      global: {
        stubs: {
          Badge: passthroughStub,
          Button: buttonStub,
          Card: passthroughStub,
          CardContent: passthroughStub,
          CardDescription: passthroughStub,
          CardHeader: passthroughStub,
          CardTitle: passthroughStub,
          Separator: passthroughStub,
          TelemetryAutomationCanvas: canvasStub,
          TelemetryAutomationInspector: inspectorStub,
        },
      },
    })

    const blankRuleButton = wrapper.findAll('button').find(button => button.text().includes('Blank Rule'))

    expect(blankRuleButton).toBeDefined()

    await blankRuleButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="designer-canvas"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="designer-canvas"]').text()).toContain('Blank rule')
    expect(wrapper.text()).toContain('1 graphs')
  })
})