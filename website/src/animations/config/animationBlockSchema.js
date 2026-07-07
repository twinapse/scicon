/**
 * @typedef {Object} AnimationStepConfig
 * @property {string} id
 * @property {string} ownerPhaseId
 * @property {'phase'|'transition'} kind
 * @property {number} durationMs
 * @property {string} caption
 * @property {Record<string, unknown>} cues
 * @property {Record<string, unknown>} overlays
 */

/**
 * @typedef {Object} AnimationBlockConfig
 * @property {string} id
 * @property {{width: number, height: number, frameRate: number}} stage
 * @property {Object} presentation
 * @property {{reducedMotionStepId: string, steps: AnimationStepConfig[]}} sequence
 * @property {Record<string, unknown>} theme
 * @property {Record<string, {path: string, intrinsicSize: [number, number]}>} assets
 * @property {Record<string, {anchor: [number, number]}>} phases
 * @property {Record<string, unknown>} constraints
 */

function assertPositiveFinite(value, path) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${path} must be a positive finite number`)
  }
}

function assertCoordinate(value, path) {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite)
  ) {
    throw new Error(`${path} must be a finite [x, y] coordinate`)
  }
}

function assertUnitInterval(value, path) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${path} must be between 0 and 1`)
  }
}

function collectAssetReferences(value, path = 'config', references = []) {
  if (!value || typeof value !== 'object') {
    return references
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectAssetReferences(item, `${path}[${index}]`, references),
    )
    return references
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'assetId' && typeof child === 'string') {
      references.push({ assetId: child, path: `${path}.${key}` })
    } else {
      collectAssetReferences(child, `${path}.${key}`, references)
    }
  }

  return references
}

/** @param {AnimationBlockConfig} config */
export function validateAnimationBlockConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('animation block config must be an object')
  }

  if (!config.id || typeof config.id !== 'string') {
    throw new Error('animation block id must be a non-empty string')
  }

  assertPositiveFinite(config.stage?.width, 'stage.width')
  assertPositiveFinite(config.stage?.height, 'stage.height')
  assertPositiveFinite(config.stage?.frameRate, 'stage.frameRate')

  const phaseEntries = Object.entries(config.phases ?? {})
  if (phaseEntries.length === 0) {
    throw new Error('phases must define at least one phase')
  }
  phaseEntries.forEach(([phaseId, phase]) =>
    assertCoordinate(phase.anchor, `phase ${phaseId} anchor`),
  )

  const steps = config.sequence?.steps
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('sequence.steps must define at least one step')
  }

  const stepIds = steps.map(({ id }) => id)
  if (new Set(stepIds).size !== stepIds.length) {
    throw new Error('step ids must be unique')
  }

  const phaseIds = new Set(phaseEntries.map(([phaseId]) => phaseId))
  steps.forEach((step) => {
    if (!step.id || typeof step.id !== 'string') {
      throw new Error('every step must define a non-empty id')
    }
    if (!phaseIds.has(step.ownerPhaseId)) {
      throw new Error(
        `step ${step.id} references unknown owner phase ${step.ownerPhaseId}`,
      )
    }
    if (!['phase', 'transition'].includes(step.kind)) {
      throw new Error(`step ${step.id} kind must be phase or transition`)
    }
    if (!Number.isFinite(step.durationMs) || step.durationMs < 0) {
      throw new Error(
        `step ${step.id} durationMs must be a non-negative finite number`,
      )
    }
  })

  const stepIdSet = new Set(stepIds)
  const reducedMotionStepId = config.sequence.reducedMotionStepId
  if (!stepIdSet.has(reducedMotionStepId)) {
    throw new Error(
      `reducedMotionStepId references unknown step ${reducedMotionStepId}`,
    )
  }

  const storylinePhases = config.presentation?.storyline?.phases ?? []
  const progressBridge = config.presentation?.storyline?.progressBridge
  if (progressBridge) {
    ;['nodeDiameter', 'edgeThickness'].forEach((field) =>
      assertPositiveFinite(progressBridge[field], `progressBridge.${field}`),
    )
    if (!Number.isFinite(progressBridge.gap) || progressBridge.gap < 0) {
      throw new Error('progressBridge.gap must be a non-negative finite number')
    }
    assertUnitInterval(
      progressBridge.inactiveOpacity,
      'progressBridge.inactiveOpacity',
    )
    assertUnitInterval(progressBridge.activeOpacity, 'progressBridge.activeOpacity')
  }
  storylinePhases.forEach((phase) => {
    const stepId = phase.activateAt?.stepId
    if (!stepIdSet.has(stepId)) {
      throw new Error(
        `storyline phase ${phase.id} references unknown step ${stepId}`,
      )
    }
    if (!phaseIds.has(phase.phaseId)) {
      throw new Error(
        `storyline phase ${phase.id} references unknown phase ${phase.phaseId}`,
      )
    }
    const offsetMs = phase.activateAt.offsetMs ?? 0
    if (!Number.isFinite(offsetMs)) {
      throw new Error(
        `storyline phase ${phase.id} offsetMs must be a finite number`,
      )
    }
  })

  const assetEntries = Object.entries(config.assets ?? {})
  assetEntries.forEach(([assetId, asset]) => {
    if (!asset.path || typeof asset.path !== 'string') {
      throw new Error(`asset ${assetId} path must be a non-empty string`)
    }
    assertCoordinate(asset.intrinsicSize, `asset ${assetId} intrinsicSize`)
    if (asset.intrinsicSize.some((size) => size <= 0)) {
      throw new Error(`asset ${assetId} intrinsicSize must be positive`)
    }
  })

  const assetIds = new Set(assetEntries.map(([assetId]) => assetId))
  collectAssetReferences(config.phases, 'phases').forEach(
    ({ assetId, path }) => {
      if (!assetIds.has(assetId)) {
        throw new Error(`${path} references unknown asset ${assetId}`)
      }
    },
  )

  return config
}

/**
 * Validate and return a readable JavaScript authoring config.
 * @param {AnimationBlockConfig} config
 * @returns {AnimationBlockConfig}
 */
export function defineAnimationBlockConfig(config) {
  return validateAnimationBlockConfig(config)
}

export function getStepConfig(config, stepId) {
  const step = config.sequence.steps.find(({ id }) => id === stepId)
  if (!step) {
    throw new Error(`Unknown ${config.id} step: ${stepId}`)
  }
  return step
}

export function getPhaseConfig(config, phaseId) {
  const phase = config.phases[phaseId]
  if (!phase) {
    throw new Error(`Unknown ${config.id} phase: ${phaseId}`)
  }
  return phase
}

export function durationMsToFrames(config, durationMs) {
  return Math.round((durationMs / 1000) * config.stage.frameRate)
}

export function resolveStorylinePhases(config) {
  const startMsByStepId = new Map()
  let elapsedMs = 0

  config.sequence.steps.forEach((step) => {
    startMsByStepId.set(step.id, elapsedMs)
    elapsedMs += step.durationMs
  })

  return config.presentation.storyline.phases.map((phase) => ({
    ...phase,
    spawnAtMs:
      startMsByStepId.get(phase.activateAt.stepId) +
      (phase.activateAt.offsetMs ?? 0),
  }))
}

export function deriveStorylineLayout(storyline) {
  const positiveFields = ['referenceWidth', 'canvasReferenceWidth']
  const nonNegativeFields = ['stageGap', 'horizontalPadding']

  positiveFields.forEach((field) =>
    assertPositiveFinite(storyline[field], field),
  )
  nonNegativeFields.forEach((field) => {
    if (!Number.isFinite(storyline[field]) || storyline[field] < 0) {
      throw new Error(`${field} must be a non-negative finite number`)
    }
  })
  storyline.phases.forEach((phase) => {
    assertPositiveFinite(
      phase.iconScale,
      `storyline phase ${phase.id} iconScale`,
    )
  })

  const phaseWidth =
    storyline.iconContainerSize +
    storyline.iconTextGap +
    storyline.textBlockWidth
  const availablePhaseWidth =
    storyline.referenceWidth - storyline.horizontalPadding * 2
  const requiredPhaseWidth = phaseWidth * storyline.phases.length
  if (availablePhaseWidth < requiredPhaseWidth) {
    throw new Error('horizontalPadding leaves insufficient room for phases')
  }
  const columnGap = storyline.phases.length > 1
    ? (availablePhaseWidth - requiredPhaseWidth) / (storyline.phases.length - 1)
    : 0
  const phaseHeight = Math.max(
    storyline.iconContainerSize,
    storyline.textBlockHeight,
  )
  const bridgeHeight = storyline.progressBridge
    ? storyline.progressBridge.gap + storyline.progressBridge.nodeDiameter
    : 0

  return {
    phaseWidth,
    phaseHeight,
    iconContainerSize: storyline.iconContainerSize,
    textBlockWidth: storyline.textBlockWidth,
    textBlockHeight: storyline.textBlockHeight,
    titleFontSize: storyline.titleMaxFontSize,
    bodyFontSize: storyline.bodyMaxFontSize,
    textGap: storyline.textGap,
    stageGap: storyline.stageGap,
    horizontalPadding: storyline.horizontalPadding,
    storylineHeight: phaseHeight + bridgeHeight,
    columnGap,
  }
}
