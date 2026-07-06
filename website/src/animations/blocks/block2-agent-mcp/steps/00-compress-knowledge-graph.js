import { createAnimation } from '../../../core/lottieHelpers.js'
import { BLOCK2_CONFIG } from '../../../config/block2Config.js'
import { BLOCK1_ASSETS } from '../../block1-scientific-output/block1Assets.js'
import { BLOCK2_ASSETS } from '../block2Assets.js'
import { BLOCK2_RUNTIME } from '../block2Runtime.js'
import { createCompressionLayers } from '../block2Scene.js'

const step = BLOCK2_RUNTIME.stepsById.get('compress-knowledge-graph')

export const compressKnowledgeGraphStep = {
  id: step.id,
  durationMs: step.durationMs,
  caption: step.caption,
  animationData: createAnimation({
    name: 'Block 2 — Compress knowledge graph',
    stage: BLOCK2_CONFIG.stage,
    durationFrames: step.durationFrames,
    assets: [...BLOCK1_ASSETS, ...BLOCK2_ASSETS],
    layers: createCompressionLayers({ durationFrames: step.durationFrames }),
  }),
}
