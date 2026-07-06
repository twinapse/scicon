import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'
import {
  createConversionToolLayers,
  createOutputContainerLayers,
  createOutputIconLayers,
  createResearchProcessLayers,
  createResearcherLayers,
} from '../block1Scene.js'

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'conversion-tool-processing')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)

export const conversionToolProcessingStep = {
  id: 'conversion-tool-processing',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Conversion tool processing',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createConversionToolLayers({ durationFrames, processing: true }),
      ...createOutputIconLayers({
        durationFrames,
        fromState: 'stacked',
      }),
      ...createOutputContainerLayers({ durationFrames }),
      ...createResearchProcessLayers({ durationFrames }),
      ...createResearcherLayers({ durationFrames }),
    ],
  }),
}
