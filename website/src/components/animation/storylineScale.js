export {
  calculateResponsiveScale,
  useResponsiveScale,
} from './useResponsiveScale.js'

export function calculateStorylineViewportHeight(
  phaseHeight,
  stageGap,
  scale,
) {
  return (phaseHeight + stageGap) * scale
}
