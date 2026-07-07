import { createSequenceAnimation } from '../../core/lottieHelpers.js'
import { BLOCK2_CONFIG } from '../../config/block2Config.js'
import { compressKnowledgeGraphStep } from './steps/00-compress-knowledge-graph.js'
import { userAgentConnectStep } from './steps/01-user-agent-connect.js'
import { queryEntersStep } from './steps/02-query-enters.js'
import { mcpTableConnectsStep } from './steps/03-mcp-table-connects.js'
import { graphAccessActivationsStep } from './steps/04-graph-access-activations.js'
import { graphAccessIdleStep } from './steps/05-graph-access-idle.js'

const BLOCK2_STEP_REGISTRY = new Map(
  [
    compressKnowledgeGraphStep,
    userAgentConnectStep,
    queryEntersStep,
    mcpTableConnectsStep,
    graphAccessActivationsStep,
    graphAccessIdleStep,
  ].map((step) => [step.id, step]),
)

export function createBlock2Manifest(
  config = BLOCK2_CONFIG,
  stepRegistry = BLOCK2_STEP_REGISTRY,
) {
  return config.sequence.steps.map((descriptor) => {
    const step = stepRegistry.get(descriptor.id)
    if (!step) {
      throw new Error(`No Block 2 step builder registered for ${descriptor.id}`)
    }
    return {
      ...descriptor,
      ...step,
      durationMs: descriptor.durationMs,
      caption: descriptor.caption,
    }
  })
}

export const block2Manifest = createBlock2Manifest()
export const BLOCK2_STEP_IDS = block2Manifest.map(({ id }) => id)

export const block2AnimationData = createSequenceAnimation({
  name: 'Block 2 — User to LLM Agent to MCP',
  stage: BLOCK2_CONFIG.stage,
  steps: block2Manifest,
})
