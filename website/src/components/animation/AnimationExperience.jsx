import { useCallback, useState } from 'react'
import { animationManifest } from '../../animations/animationManifest.js'
import AnimationController from './AnimationController.jsx'
import ConversionToolOverlay from './ConversionToolOverlay.jsx'
import { useResponsiveScale } from './useResponsiveScale.js'
import {
  INITIAL_EXPERIENCE_STATE,
  EXPERIENCE_CONFIG,
  continueToBlock2,
  getExperienceControls,
  markBlockComplete,
  returnToBlock1,
} from './experienceState.js'

const OVERLAY_RENDERERS_BY_BLOCK = {
  block1: { conversionTool: ConversionToolOverlay },
  block2: {},
}

const RESTART_CONTROL = Object.freeze({
  label: 'Restart',
  arrow: '↻',
  arrowPosition: 'start',
  action: 'replay',
})

function AnimationExperience() {
  const [experience, setExperience] = useState(INITIAL_EXPERIENCE_STATE)
  const [replayNonce, setReplayNonce] = useState(0)
  const block = animationManifest[experience.activeBlockId]
  const referenceWidth = Math.max(
    block.presentation.storyline.referenceWidth,
    block.presentation.storyline.canvasReferenceWidth,
  )

  const handleBlockComplete = useCallback(() => {
    setExperience((current) =>
      markBlockComplete(current, current.activeBlockId),
    )
  }, [])

  const handleContinue = useCallback(() => {
    setExperience((current) => continueToBlock2(current))
  }, [])

  const handleReturn = useCallback(() => {
    setExperience((current) => returnToBlock1(current))
  }, [])

  // Remount the controller from a fresh block1 to replay the animation on demand.
  const handleReplay = useCallback(() => {
    setExperience(INITIAL_EXPERIENCE_STATE)
    setReplayNonce((nonce) => nonce + 1)
  }, [])

  const controls = [RESTART_CONTROL, ...getExperienceControls(experience)]
  const canvasReferenceWidth = block.presentation.storyline.canvasReferenceWidth
  const [controlsRef, controlScale] = useResponsiveScale(
    canvasReferenceWidth,
    controls.length > 0,
  )
  const controlHandlers = {
    block1: handleReturn,
    block2: handleContinue,
    replay: handleReplay,
  }

  return (
    <div
      className="animation-experience"
      style={{ maxWidth: `${referenceWidth}px` }}
    >
      <AnimationController
        key={`${block.id}-${replayNonce}`}
        block={block}
        overlayRenderers={OVERLAY_RENDERERS_BY_BLOCK[block.id]}
        onComplete={handleBlockComplete}
      />
      {controls.length > 0 ? (
        <div
          ref={controlsRef}
          className="animation-experience__controls"
          style={{
            maxWidth: `${canvasReferenceWidth}px`,
            '--animation-control-scale': controlScale,
            '--animation-control-top-gap': `${EXPERIENCE_CONFIG.button.topGap}px`,
            '--animation-control-label-font-size': `${EXPERIENCE_CONFIG.button.labelFontSize}px`,
            '--animation-control-horizontal-padding': `${EXPERIENCE_CONFIG.button.horizontalPadding}px`,
            '--animation-control-arrow-font-size': `${EXPERIENCE_CONFIG.button.arrowFontSize}px`,
            '--animation-control-arrow-gap': `${EXPERIENCE_CONFIG.button.arrowGap}px`,
          }}
        >
          {controls.map((control) => (
            <button
              key={control.action}
              className="animation-experience__control"
              type="button"
              aria-label={`${control.label} ${control.arrow}`}
              onClick={controlHandlers[control.action]}
            >
              {control.arrowPosition === 'start' ? (
                <span
                  className="animation-experience__control-arrow"
                  aria-hidden="true"
                >
                  {control.arrow}
                </span>
              ) : null}
              <span className="animation-experience__control-label">
                {control.label}
              </span>
              {control.arrowPosition === 'end' ? (
                <span
                  className="animation-experience__control-arrow"
                  aria-hidden="true"
                >
                  {control.arrow}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default AnimationExperience
