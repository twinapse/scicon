import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { createResearcherLayers } from '../block1Scene.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'researcher-appears')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)

export const researcherAppearsStep = {
  id: 'researcher-appears',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Researcher appears',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createResearcherLayers({ durationFrames, animateIn: true }),
    ],
  }),
}
