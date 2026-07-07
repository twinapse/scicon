import {
  durationMsToFrames,
  getPhaseConfig,
  getStepConfig,
} from '../../config/animationBlockSchema.js'
import { BLOCK1_CONFIG } from '../../config/block1Config.js'

function addPosition([x, y], [offsetX, offsetY]) {
  return [x + offsetX, y + offsetY]
}

function createProcessRailLayout(centerX, process) {
  const glyphWidth = process.fontSize * 0.6
  const widths = process.items.map(({ text }) => text.length * glyphWidth)
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    process.gap * (widths.length - 1)
  let cursor = centerX - totalWidth / 2
  const centers = widths.map((width) => {
    const center = cursor + width / 2
    cursor += width + process.gap
    return center
  })

  return {
    statusX: {
      parse: centers[0],
      normalize: centers[2],
      validate: centers[4],
    },
    arrowX: {
      parseNormalize: centers[1],
      normalizeValidate: centers[3],
    },
  }
}

export function deriveBlock1PanelWidths(config) {
  const scientificOutput = config.phases.scientificOutput.panel.size[0]
  const conversionTool = config.phases.conversionTool.panel.width
  const synchronization = config.constraints.synchronizedPanelWidth
  const source = synchronization?.sourcePhaseId ?? null

  if (source === null) {
    return { scientificOutput, conversionTool }
  }
  if (source === 'scientificOutput') {
    return { scientificOutput, conversionTool: scientificOutput }
  }
  if (source === 'conversionTool') {
    return { scientificOutput: conversionTool, conversionTool }
  }
  throw new Error(`Unknown Block 1 panel width source phase: ${source}`)
}

export function deriveBlock1Layout(config) {
  const research = getPhaseConfig(config, 'research')
  const scientificOutputPhase = getPhaseConfig(config, 'scientificOutput')
  const conversion = getPhaseConfig(config, 'conversionTool')
  const graph = getPhaseConfig(config, 'knowledgeGraph')
  const panelWidths = deriveBlock1PanelWidths(config)
  const process = research.process
  const firstNodeX = research.anchor[0] - process.nodeGap * 3
  const nodeCenters = Array.from({ length: process.nodes.length }, (_, index) => [
    firstNodeX + index * process.nodeGap,
    research.anchor[1] + process.pathOffset[1],
  ])
  const conversionContentWidth =
    conversion.inputs.width +
    conversion.layout.inputEngineGap +
    conversion.engine.size
  const conversionContentLeft =
    conversion.anchor[0] - conversionContentWidth / 2
  const inputX = conversionContentLeft + conversion.inputs.width / 2
  const engineX =
    conversionContentLeft +
    conversion.inputs.width +
    conversion.layout.inputEngineGap +
    conversion.engine.size / 2
  const inputRowStep = conversion.inputs.height + conversion.inputs.verticalGap
  const inputCenters = {
    paper: [inputX, conversion.anchor[1] - inputRowStep],
    code: [inputX, conversion.anchor[1]],
    data: [inputX, conversion.anchor[1] + inputRowStep],
  }
  const scientificPanelCenter = addPosition(
    scientificOutputPhase.anchor,
    scientificOutputPhase.panel.positionOffset,
  )
  const graphClusterCenters = Object.fromEntries(
    Object.entries(graph.clusterCenterOffsets).map(([category, offset]) => [
      category,
      addPosition(graph.anchor, offset),
    ]),
  )

  return {
    sequenceCenterX: research.anchor[0],
    researcher: addPosition(
      research.anchor,
      research.researcher.positionOffset,
    ),
    researcherWidth: research.researcher.displayWidth,
    researchProcess: {
      title: addPosition(research.anchor, process.title.positionOffset),
      nodeCenters,
      iconNodeCenters: Object.fromEntries(
        process.nodes
          .filter(({ type }) => type === 'icon')
          .map(({ category, index }) => [category, nodeCenters[index - 1]]),
      ),
      knockout: {
        center: addPosition(research.anchor, process.knockout.positionOffset),
        width: process.knockout.size[0],
        height: process.knockout.size[1],
      },
    },
    scatteredIcons: Object.fromEntries(
      Object.entries(research.scatteredOutputOffsets).map(
        ([category, offset]) => [category, addPosition(research.anchor, offset)],
      ),
    ),
    outputRow: {
      center: addPosition(
        scientificOutputPhase.anchor,
        scientificOutputPhase.row.centerOffset,
      ),
      y: scientificOutputPhase.anchor[1] + scientificOutputPhase.row.yOffset,
      xByCategory: Object.fromEntries(
        Object.entries(scientificOutputPhase.row.categoryXOffsets).map(
          ([category, offset]) => [
            category,
            scientificOutputPhase.anchor[0] + offset,
          ],
        ),
      ),
      iconSize: scientificOutputPhase.artifact.iconSize,
      tileSize: scientificOutputPhase.artifact.tileSize,
      copyIconSize: scientificOutputPhase.copy.iconSize,
      copyTileSize: scientificOutputPhase.copy.tileSize,
    },
    scientificOutput: {
      center: scientificPanelCenter,
      width: panelWidths.scientificOutput,
      height: scientificOutputPhase.panel.size[1],
      title: [
        scientificPanelCenter[0],
        scientificPanelCenter[1] -
          scientificOutputPhase.panel.size[1] / 2 +
          scientificOutputPhase.panel.title.topInset,
      ],
    },
    conversionTool: {
      center: conversion.anchor,
      width: panelWidths.conversionTool,
      height: conversion.panel.height,
      title: [
        conversion.anchor[0],
        conversion.anchor[1] -
          conversion.panel.height / 2 +
          conversion.title.topInset,
      ],
      launch: addPosition(conversion.anchor, conversion.layout.launchOffset),
      engine: [engineX, conversion.anchor[1]],
      connectorTarget: [engineX, conversion.anchor[1]],
      connectorHub: [
        engineX - conversion.engine.size / 2 - conversion.layout.connectorHubInset,
        conversion.anchor[1],
      ],
      inputCenters,
      inputPorts: Object.fromEntries(
        Object.entries(inputCenters).map(([category, position]) => [
          category,
          [position[0] + conversion.inputs.width / 2, position[1]],
        ]),
      ),
      processRail: {
        y: conversion.anchor[1] + conversion.process.yOffset,
        ...createProcessRailLayout(conversion.anchor[0], conversion.process),
      },
    },
    graph: { center: graph.anchor, clusterCenters: graphClusterCenters },
    graphField: {
      left: graph.anchor[0] + graph.fieldOffsets.left,
      right: graph.anchor[0] + graph.fieldOffsets.right,
      top: graph.anchor[1] + graph.fieldOffsets.top,
      bottom: graph.anchor[1] + graph.fieldOffsets.bottom,
    },
  }
}

export function deriveConversionToolSchedule(config) {
  const idleStep = getStepConfig(config, 'scientific-output-idle')
  const transferStep = getStepConfig(config, 'output-to-conversion-tool')
  const processingStep = getStepConfig(config, 'conversion-tool-processing')
  const shell = idleStep.cues.conversionToolShell
  const inputs = transferStep.cues.conversionToolInputs
  const values = {
    idleDurationMs: idleStep.durationMs,
    transferDurationMs: transferStep.durationMs,
    processingDurationMs: processingStep.durationMs,
    shellLeadInMs: shell.leadInMs,
    shellRevealDurationMs: shell.revealDurationMs,
    inputsDelayMs: inputs.delayMs,
    inputsRevealDurationMs: inputs.revealDurationMs,
  }

  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative finite number`)
    }
  }
  if (shell.leadInMs > idleStep.durationMs) {
    throw new Error('conversionToolShell leadInMs must fit its owning step')
  }
  if (shell.revealDurationMs > shell.leadInMs) {
    throw new Error('conversionToolShell revealDurationMs must not exceed leadInMs')
  }
  if (inputs.delayMs + inputs.revealDurationMs > transferStep.durationMs) {
    throw new Error('conversionToolInputs reveal must fit its owning step')
  }

  const shellRevealStartMs = idleStep.durationMs - shell.leadInMs
  const shellRevealEndMs = shellRevealStartMs + shell.revealDurationMs
  const inputsRevealEndMs = inputs.delayMs + inputs.revealDurationMs

  return {
    shell: {
      revealStartMs: shellRevealStartMs,
      revealEndMs: shellRevealEndMs,
      revealStartFrame: durationMsToFrames(config, shellRevealStartMs),
      revealEndFrame:
        durationMsToFrames(config, shellRevealStartMs) +
        durationMsToFrames(config, shell.revealDurationMs),
    },
    inputs: {
      revealStartMs: inputs.delayMs,
      revealEndMs: inputsRevealEndMs,
      revealStartFrame: durationMsToFrames(config, inputs.delayMs),
      revealEndFrame:
        durationMsToFrames(config, inputs.delayMs) +
        durationMsToFrames(config, inputs.revealDurationMs),
    },
    processingDurationMs: processingStep.durationMs,
  }
}

export function createBlock1AssetCatalog(config, resolveAssetUrl) {
  const lottieAssets = Object.values(config.assets)
    .filter(({ lottieId }) => lottieId)
    .map(({ lottieId: id, path, intrinsicSize: [width, height] }) => ({
      id,
      width,
      height,
      url: resolveAssetUrl(path),
    }))
  const lottieIdForAsset = (assetId) => config.assets[assetId].lottieId
  const outputAssetByCategory = Object.fromEntries(
    Object.entries(config.phases.scientificOutput.categories).map(
      ([category, { assetId }]) => [category, lottieIdForAsset(assetId)],
    ),
  )
  const graphIconAssetByName = {}
  Object.values(config.phases.knowledgeGraph.content).flat().forEach(
    ({ icon, assetId }) => {
      graphIconAssetByName[icon] = lottieIdForAsset(assetId)
    },
  )

  return {
    lottieAssets,
    assetSizeById: Object.fromEntries(
      lottieAssets.map(({ id, width, height }) => [id, [width, height]]),
    ),
    outputAssetByCategory,
    graphIconAssetByName,
    conversionToolAssetUrls: {
      container: resolveAssetUrl(config.assets.conversionToolContainer.path),
      engine: resolveAssetUrl(config.assets.conversionToolEngine.path),
    },
  }
}

export const BLOCK1_RUNTIME = {
  config: BLOCK1_CONFIG,
  stage: BLOCK1_CONFIG.stage,
  stepsById: new Map(
    BLOCK1_CONFIG.sequence.steps.map((step) => [step.id, step]),
  ),
  phasesById: new Map(Object.entries(BLOCK1_CONFIG.phases)),
  layout: deriveBlock1Layout(BLOCK1_CONFIG),
  conversionToolSchedule: deriveConversionToolSchedule(BLOCK1_CONFIG),
}
