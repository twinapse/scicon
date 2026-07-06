import { conversionToolProcessingStep } from './steps/04-conversion-tool-processing.js'
import { conversionToolToGraphStep } from './steps/05-conversion-tool-to-graph.js'
import { graphEdgesAppearStep } from './steps/06-graph-edges-appear.js'
import { outputToConversionToolStep } from './steps/03-output-to-conversion-tool.js'
import { researcherAppearsStep } from './steps/01-researcher-appears.js'
import { researchProcessPathStep } from './steps/02-research-process-path.js'
import { researchProcessToScientificOutputStep } from './steps/03-research-process-to-scientific-output.js'
import { scientificOutputIdleStep } from './steps/03-scientific-output-idle.js'
import { createSequenceAnimation } from '../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../config/block1Config.js'
import { createResearcherLayers } from './block1Scene.js'

const BLOCK1_STEP_REGISTRY = new Map(
  [
    researcherAppearsStep,
    researchProcessPathStep,
    researchProcessToScientificOutputStep,
    scientificOutputIdleStep,
    outputToConversionToolStep,
    conversionToolProcessingStep,
    conversionToolToGraphStep,
    graphEdgesAppearStep,
  ].map((step) => [step.id, step]),
)

export function createBlock1Manifest(
  config = BLOCK1_CONFIG,
  stepRegistry = BLOCK1_STEP_REGISTRY,
) {
  return config.sequence.steps.map((descriptor) => {
    const step = stepRegistry.get(descriptor.id)
    if (!step) {
      throw new Error(
        `No Block 1 step builder registered for ${descriptor.id}`,
      )
    }
    return { ...descriptor, ...step, durationMs: descriptor.durationMs, caption: descriptor.caption }
  })
}

export const block1Manifest = createBlock1Manifest()

export const BLOCK1_STEP_IDS = block1Manifest.map((step) => step.id)
export const BLOCK1_CAPTIONS = block1Manifest.map((step) => step.caption)

export const block1AnimationData = createSequenceAnimation({
  name: 'Block 1 — Scientific output to knowledge graph',
  stage: BLOCK1_CONFIG.stage,
  steps: block1Manifest,
  persistentLayers: ({ totalFrames }) =>
    createResearcherLayers({ durationFrames: totalFrames }).map((layer) => ({
      ...layer,
      nm: 'Persistent Researcher',
      ip: researcherAppearsStep.animationData.op,
      op: totalFrames,
    })),
  precompLayerFilter: ({ layer, stepIndex }) =>
    stepIndex === 0 || layer.nm !== 'Researcher',
})
