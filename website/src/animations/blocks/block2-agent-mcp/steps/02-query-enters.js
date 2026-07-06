import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK2_CONFIG } from '../../../config/block2Config.js'
import { BLOCK2_ASSETS } from '../block2Assets.js'
import { BLOCK2_RUNTIME } from '../block2Runtime.js'
import { createBlock2SceneLayers } from '../block2Scene.js'

const step = BLOCK2_RUNTIME.stepsById.get('query-enters')

export const queryEntersStep = {
  id: step.id,
  durationMs: step.durationMs,
  caption: step.caption,
  animationData: createAnimation({
    name: 'Block 2 — Query enters',
    stage: BLOCK2_CONFIG.stage,
    durationFrames: step.durationFrames,
    assets: BLOCK2_ASSETS,
    layers: createBlock2SceneLayers({
      durationFrames: step.durationFrames,
      phase: 'userQuery',
      animateCurrentPhase: true,
    }),
  }),
}
