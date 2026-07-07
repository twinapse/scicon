import { resolveAssetUrl } from '../../animations/core/assets.js'
import { deriveStorylineLayout } from '../../animations/config/animationBlockSchema.js'
import { calculateStorylineViewportHeight } from './storylineScale.js'
import { useResponsiveScale } from './useResponsiveScale.js'

function PhaseStoryline({
  storyline,
  reducedMotion,
  ariaLabel = 'Animation storyline',
}) {
  const className = reducedMotion
    ? 'phase-storyline phase-storyline--reduced-motion'
    : 'phase-storyline'
  const layout = deriveStorylineLayout(storyline)
  const [viewportRef, compositionScale] = useResponsiveScale(
    storyline.referenceWidth,
  )
  const viewportHeight = calculateStorylineViewportHeight(
    layout.storylineHeight,
    layout.stageGap,
    compositionScale,
  )

  return (
    <div
      ref={viewportRef}
      className="phase-storyline__viewport"
      style={{
        height: `${viewportHeight}px`,
        maxWidth: `${storyline.referenceWidth}px`,
        '--story-composition-scale': compositionScale,
      }}
    >
      <ol
        className={className}
        aria-label={ariaLabel}
        style={{
          '--story-reference-width': `${storyline.referenceWidth}px`,
          '--story-phase-width': `${layout.phaseWidth}px`,
          '--story-phase-height': `${layout.phaseHeight}px`,
          '--story-icon-size': `${layout.iconContainerSize}px`,
          '--story-text-width': `${layout.textBlockWidth}px`,
          '--story-text-height': `${layout.textBlockHeight}px`,
          '--story-icon-text-gap': `${storyline.iconTextGap}px`,
          '--story-title-font-size': `${layout.titleFontSize}px`,
          '--story-body-font-size': `${layout.bodyFontSize}px`,
          '--story-text-gap': `${layout.textGap}px`,
          '--story-horizontal-padding': `${layout.horizontalPadding}px`,
          '--story-column-gap': `${layout.columnGap}px`,
          '--story-bridge-gap': `${storyline.progressBridge.gap}px`,
          '--story-bridge-node-diameter': `${storyline.progressBridge.nodeDiameter}px`,
          '--story-bridge-edge-thickness': `${storyline.progressBridge.edgeThickness}px`,
          '--story-bridge-inactive-color': storyline.progressBridge.inactiveColor,
          '--story-bridge-inactive-opacity': storyline.progressBridge.inactiveOpacity,
          '--story-bridge-active-edge-color': storyline.progressBridge.activeEdgeColor,
          '--story-bridge-active-opacity': storyline.progressBridge.activeOpacity,
          '--story-total-height': `${layout.storylineHeight}px`,
        }}
      >
        {storyline.phases.map((phase, index) => (
          <li
            key={phase.id}
            className="phase-storyline__item"
            style={{
              '--phase-accent': phase.accentColor,
              '--phase-spawn-delay': `${phase.spawnAtMs}ms`,
              '--phase-activation-delay': `${phase.spawnAtMs}ms`,
              '--story-icon-scale': phase.iconScale,
            }}
          >
            <div className="phase-storyline__phase-content">
              <div
                className="phase-storyline__icon-frame"
                aria-hidden="true"
              >
                <img
                  className="phase-storyline__icon"
                  src={resolveAssetUrl(phase.iconPath)}
                  alt=""
                />
              </div>
              <div className="phase-storyline__description">
                <h2 className="phase-storyline__title">
                  {index + 1}. {phase.title}
                </h2>
                <p className="phase-storyline__body">{phase.description}</p>
              </div>
            </div>
            <div className="phase-storyline__progress" aria-hidden="true">
              {index > 0 ? (
                <span className="phase-storyline__progress-edge" />
              ) : null}
              <span className="phase-storyline__progress-node" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default PhaseStoryline
