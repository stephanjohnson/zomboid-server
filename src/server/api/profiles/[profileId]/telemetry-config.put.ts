import * as v from 'valibot'

import {
  automationNodeTypes,
  automationStudioVersion,
} from '../../../../shared/telemetry-automation'

const ListenerSchema = v.object({
  adapterKey: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  eventKey: v.optional(v.nullable(v.string())),
  isEnabled: v.optional(v.boolean(), true),
  config: v.optional(v.record(v.string(), v.unknown())),
})

const WorkflowStepSchema = v.object({
  stepOrder: v.pipe(v.number(), v.minValue(1)),
  eventKey: v.pipe(v.string(), v.trim(), v.minLength(1)),
  withinSeconds: v.optional(v.nullable(v.pipe(v.number(), v.minValue(1)))),
  matchConfig: v.optional(v.record(v.string(), v.unknown())),
})

const WorkflowSchema = v.object({
  key: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  isEnabled: v.optional(v.boolean(), true),
  config: v.optional(v.record(v.string(), v.unknown())),
  steps: v.array(WorkflowStepSchema),
})

const ActionRuleSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  triggerKind: v.picklist(['EVENT', 'WORKFLOW']),
  triggerKey: v.pipe(v.string(), v.trim(), v.minLength(1)),
  isEnabled: v.optional(v.boolean(), true),
  moneyAmount: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  xpAmount: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  xpCategory: v.optional(v.nullable(v.string())),
  xpCategoryAmount: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  config: v.optional(v.record(v.string(), v.unknown())),
})

const AutomationNodeSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1)),
  type: v.picklist(automationNodeTypes),
  label: v.pipe(v.string(), v.trim(), v.minLength(1)),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  data: v.optional(v.record(v.string(), v.unknown()), {}),
})

const AutomationEdgeSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1)),
  source: v.pipe(v.string(), v.trim(), v.minLength(1)),
  target: v.pipe(v.string(), v.trim(), v.minLength(1)),
  sourceHandle: v.optional(v.nullable(v.string())),
  targetHandle: v.optional(v.nullable(v.string())),
  label: v.optional(v.string()),
  animated: v.optional(v.boolean(), false),
})

const AutomationGraphSchema = v.object({
  id: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  description: v.optional(v.string(), ''),
  isEnabled: v.optional(v.boolean(), true),
  nodes: v.array(AutomationNodeSchema),
  edges: v.array(AutomationEdgeSchema),
})

const AutomationStudioConfigSchema = v.object({
  version: v.literal(automationStudioVersion),
  graphs: v.array(AutomationGraphSchema),
})

const UpdateTelemetryConfigSchema = v.object({
  listeners: v.optional(v.array(ListenerSchema), []),
  workflows: v.optional(v.array(WorkflowSchema), []),
  actionRules: v.optional(v.array(ActionRuleSchema), []),
  automationStudioConfig: v.optional(AutomationStudioConfigSchema, {
    version: automationStudioVersion,
    graphs: [],
  }),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const profileId = getRouterParam(event, 'profileId')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Profile ID required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateTelemetryConfigSchema))

  const profile = await prisma.serverProfile.findUnique({ where: { id: profileId } })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.serverProfile.update({
      where: { id: profileId },
      data: {
        automationStudioConfig: body.automationStudioConfig,
      },
    })

    await transaction.telemetryListener.deleteMany({ where: { profileId } })
    await transaction.actionRule.deleteMany({ where: { profileId } })

    const existingWorkflows = await transaction.workflowDefinition.findMany({
      where: { profileId },
      select: { id: true },
    })
    if (existingWorkflows.length > 0) {
      await transaction.workflowStep.deleteMany({
        where: {
          workflowId: { in: existingWorkflows.map(workflow => workflow.id) },
        },
      })
      await transaction.workflowRun.deleteMany({
        where: {
          workflowId: { in: existingWorkflows.map(workflow => workflow.id) },
        },
      })
    }
    await transaction.workflowDefinition.deleteMany({ where: { profileId } })

    if (body.listeners.length > 0) {
      await transaction.telemetryListener.createMany({
        data: body.listeners.map(listener => ({
          profileId,
          adapterKey: listener.adapterKey,
          name: listener.name,
          eventKey: listener.eventKey ?? null,
          isEnabled: listener.isEnabled ?? true,
          config: listener.config,
        })),
      })
    }

    if (body.actionRules.length > 0) {
      await transaction.actionRule.createMany({
        data: body.actionRules.map(rule => ({
          profileId,
          name: rule.name,
          triggerKind: rule.triggerKind,
          triggerKey: rule.triggerKey,
          isEnabled: rule.isEnabled ?? true,
          moneyAmount: Math.floor(rule.moneyAmount ?? 0),
          xpAmount: Math.floor(rule.xpAmount ?? 0),
          xpCategory: rule.xpCategory ?? null,
          xpCategoryAmount: Math.floor(rule.xpCategoryAmount ?? 0),
          config: rule.config,
        })),
      })
    }

    for (const workflow of body.workflows) {
      const createdWorkflow = await transaction.workflowDefinition.create({
        data: {
          profileId,
          key: workflow.key,
          name: workflow.name,
          isEnabled: workflow.isEnabled ?? true,
          config: workflow.config,
        },
      })

      await transaction.workflowStep.createMany({
        data: workflow.steps.map(step => ({
          workflowId: createdWorkflow.id,
          stepOrder: Math.floor(step.stepOrder),
          eventKey: step.eventKey,
          withinSeconds: step.withinSeconds == null ? null : Math.floor(step.withinSeconds),
          matchConfig: step.matchConfig,
        })),
      })
    }

    await transaction.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'profile.telemetry-config.update',
        target: profileId,
        details: body as Record<string, unknown>,
      },
    })
  })

  return {
    ok: true,
    profileId,
  }
})