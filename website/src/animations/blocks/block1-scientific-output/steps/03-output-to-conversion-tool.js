import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'
import { BLOCK1_RUNTIME } from '../block1Runtime.js'
import {
  createConversionToolLayers,
  createOutputContainerLayers,
  createOutputIconLayers,
  createResearchProcessLayers,
  createResearcherLayers,
} from '../block1Scene.js'

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'output-to-conversion-tool')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)
const conversionToolSchedule = BLOCK1_RUNTIME.conversionToolSchedule

export const outputToConversionToolStep = {
  id: 'output-to-conversion-tool',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Outputs enter conversion tool',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createOutputIconLayers({
        durationFrames,
        fromState: 'stacked',
        copies: true,
        consume: true,
      }),
      ...createOutputIconLayers({
        durationFrames,
        fromState: 'stacked',
      }),
      ...createConversionToolLayers({
        durationFrames,
        inputsRevealFrames: {
          startFrame: conversionToolSchedule.inputs.revealStartFrame,
          endFrame: conversionToolSchedule.inputs.revealEndFrame,
        },
        connectorMode: 'growing',
      }),
      ...createOutputContainerLayers({ durationFrames }),
      ...createResearchProcessLayers({ durationFrames }),
      ...createResearcherLayers({ durationFrames }),
    ],
  }),
}
