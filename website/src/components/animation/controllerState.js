export function getInitialStepIndex({
  reducedMotion,
  steps,
  reducedMotionStepId,
}) {
  if (!reducedMotion) {
    return 0
  }

  const configuredIndex = steps.findIndex(
    ({ id }) => id === reducedMotionStepId,
  )
  return configuredIndex >= 0 ? configuredIndex : Math.max(steps.length - 1, 0)
}

export function getCompletionDelayMs({
  reducedMotion,
  currentStepIndex,
  steps,
}) {
  if (reducedMotion) {
    return 0
  }

  if (currentStepIndex !== steps.length - 1) {
    return null
  }

  return steps[currentStepIndex]?.durationMs ?? 0
}

export function getStepOverlayState({ step, overlayId, reducedMotion }) {
  const state = step.overlays?.[overlayId] ?? { visible: false }

  return {
    visible: state.visible ?? false,
    intro: reducedMotion ? false : (state.intro ?? false),
    spinning: reducedMotion ? false : (state.spinning ?? false),
  }
}
