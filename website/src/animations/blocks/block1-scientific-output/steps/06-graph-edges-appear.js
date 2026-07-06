import { BLOCK1_ASSETS } from '../block1Assets.js'
import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../../config/block1Config.js'
import {
  durationMsToFrames,
  getStepConfig,
} from '../../../config/animationBlockSchema.js'
import {
  createConversionToolLayers,
  createGraphEdgeLayers,
  createGraphNodeLayers,
  createOutputContainerLayers,
  createOutputIconLayers,
  createResearchProcessLayers,
  createResearcherLayers,
} from '../block1Scene.js'

const stepConfig = getStepConfig(BLOCK1_CONFIG, 'graph-edges-appear')
const durationMs = stepConfig.durationMs
const durationFrames = durationMsToFrames(BLOCK1_CONFIG, durationMs)

export const graphEdgesAppearStep = {
  id: 'graph-edges-appear',
  durationMs,
  caption: stepConfig.caption,
  animationData: createAnimation({
    name: 'Block 1 — Knowledge graph relationships',
    stage: BLOCK1_CONFIG.stage,
    durationFrames,
    assets: BLOCK1_ASSETS,
    layers: [
      ...createGraphNodeLayers({ durationFrames }),
      ...createGraphEdgeLayers({ durationFrames, animateIn: true }),
      ...createConversionToolLayers({ durationFrames, completed: true }),
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
