import {
  block1AnimationData,
  block1Manifest,
} from './blocks/block1-scientific-output/block1.manifest.js'
import {
  block2AnimationData,
  block2Manifest,
} from './blocks/block2-agent-mcp/block2.manifest.js'
import { resolveStorylinePhases } from './config/animationBlockSchema.js'
import { BLOCK1_CONFIG } from './config/block1Config.js'
import { BLOCK2_CONFIG } from './config/block2Config.js'

const block1Presentation = {
  ...BLOCK1_CONFIG.presentation,
  storyline: {
    ...BLOCK1_CONFIG.presentation.storyline,
    phases: resolveStorylinePhases(BLOCK1_CONFIG),
  },
}

const block2Presentation = {
  ...BLOCK2_CONFIG.presentation,
  storyline: {
    ...BLOCK2_CONFIG.presentation.storyline,
    phases: resolveStorylinePhases(BLOCK2_CONFIG),
  },
}

export const animationManifest = {
  block1: {
    id: BLOCK1_CONFIG.id,
    config: BLOCK1_CONFIG,
    animationData: block1AnimationData,
    steps: block1Manifest,
    presentation: block1Presentation,
  },
  block2: {
    id: BLOCK2_CONFIG.id,
    config: BLOCK2_CONFIG,
    animationData: block2AnimationData,
    steps: block2Manifest,
    presentation: block2Presentation,
  },
}
