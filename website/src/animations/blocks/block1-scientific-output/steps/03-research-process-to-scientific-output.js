import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'
import {
  createOutputContainerLayers,
  createOutputIconLayers,
  createResearchProcessLayers,
  createResearcherLayers,
} from '../block1Scene.js'

const stepConfig = getStepConfig(
  BLOCK1_CONFIG,
  'research-process-to-scientific-output',
)
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)

export const researchProcessToScientificOutputStep = {
  id: 'research-process-to-scientific-output',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Research process to Scientific Output',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createOutputIconLayers({
        durationFrames,
        fromState: 'researchProcess',
        toState: 'stacked',
      }),
      ...createOutputContainerLayers({ durationFrames, animateIn: true }),
      ...createResearchProcessLayers({ durationFrames }),
      ...createResearcherLayers({ durationFrames }),
    ],
  }),
}
