import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'
import {
  createResearchProcessLayers,
  createResearcherLayers,
} from '../block1Scene.js'

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'research-process-path')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)

export const researchProcessPathStep = {
  id: 'research-process-path',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Research process path',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createResearchProcessLayers({ durationFrames, animateIn: true }),
      ...createResearcherLayers({ durationFrames }),
    ],
  }),
}
