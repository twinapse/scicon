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

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'scientific-output-idle')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)
const conversionToolSchedule = BLOCK1_RUNTIME.conversionToolSchedule

export const scientificOutputIdleStep = {
  id: 'scientific-output-idle',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Scientific output ready',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createConversionToolLayers({
        durationFrames,
        includeInputs: false,
        titleRevealFrames: {
          startFrame: conversionToolSchedule.shell.revealStartFrame,
          endFrame: conversionToolSchedule.shell.revealEndFrame,
        },
        connectorMode: 'hidden',
      }),
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
