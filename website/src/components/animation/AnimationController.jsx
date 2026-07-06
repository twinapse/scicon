import { useEffect, useRef, useState } from 'react'
import {
  getCompletionDelayMs,
  getInitialStepIndex,
  getStepOverlayState,
} from './controllerState.js'
import AnimationBlockLayout from './AnimationBlockLayout.jsx'
import LottieStage from './LottieStage.jsx'
import PhaseStoryline from './PhaseStoryline.jsx'
import { useReducedMotion } from './useReducedMotion.js'

function AnimationController({ block, overlayRenderers = {}, onComplete }) {
  const { animationData, config, presentation, steps } = block
  const { storyline } = presentation
  const reducedMotion = useReducedMotion()
  const completionNotifiedRef = useRef(false)
  const [playbackStepIndex, setPlaybackStepIndex] = useState(() =>
    getInitialStepIndex({
      reducedMotion: false,
      steps,
      reducedMotionStepId: config.sequence.reducedMotionStepId,
    }),
  )
  const currentStepIndex = reducedMotion
    ? getInitialStepIndex({
        reducedMotion: true,
        steps,
        reducedMotionStepId: config.sequence.reducedMotionStepId,
      })
    : playbackStepIndex

  useEffect(() => {
    completionNotifiedRef.current = false
  }, [block.id])

  useEffect(() => {
    if (!reducedMotion && currentStepIndex < steps.length - 1) {
      const timer = window.setTimeout(() => {
        setPlaybackStepIndex((stepIndex) =>
          Math.min(stepIndex + 1, steps.length - 1),
        )
      }, steps[currentStepIndex].durationMs)

      return () => window.clearTimeout(timer)
    }

    const completionDelayMs = getCompletionDelayMs({
      reducedMotion,
      currentStepIndex,
      steps,
    })
    if (
      completionDelayMs === null ||
      !onComplete ||
      completionNotifiedRef.current
    ) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      if (completionNotifiedRef.current) {
        return
      }
      completionNotifiedRef.current = true
      onComplete()
    }, completionDelayMs)

    return () => window.clearTimeout(timer)
  }, [currentStepIndex, onComplete, reducedMotion, steps])

  const currentStep = steps[currentStepIndex]
  const overlays = Object.entries(currentStep.overlays ?? {}).flatMap(
    ([overlayId]) => {
      const Overlay = overlayRenderers[overlayId]
      return Overlay
        ? [
            <Overlay
              key={overlayId}
              {...getStepOverlayState({ step: currentStep, overlayId, reducedMotion })}
            />,
          ]
        : []
    },
  )

  return (
    <AnimationBlockLayout
      storylineReferenceWidth={storyline.referenceWidth}
      canvasReferenceWidth={storyline.canvasReferenceWidth}
      ariaLabel={presentation.ariaLabel}
      storyline={
        <PhaseStoryline
          storyline={storyline}
          reducedMotion={reducedMotion}
          ariaLabel={
            presentation.storylineAriaLabel ?? `${presentation.ariaLabel} storyline`
          }
        />
      }
    >
      <LottieStage
        animationData={
          reducedMotion ? steps.at(-1).animationData : animationData
        }
        play={!reducedMotion}
      />
      {overlays}
    </AnimationBlockLayout>
  )
}

export default AnimationController
