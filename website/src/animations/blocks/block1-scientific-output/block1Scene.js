import {
  ASSET_SIZE_BY_ID,
  GRAPH_ICON_ASSET_BY_NAME,
  OUTPUT_ASSET_BY_CATEGORY,
} from './block1Assets.js'
import { hexToRgba } from '../../core/colors.js'
import {
  circleLayer,
  curvedPathLayer,
  displaySizeFromWidth,
  edgeLayer,
  imageLayer,
  rectangleLayer,
  textLayer,
  transitionKeyframes,
} from '../../core/lottieHelpers.js'
import { BLOCK1_CONFIG } from '../../config/block1Config.js'
import {
  getLottieFontByWeight,
  LOTTIE_MONO_FONT,
} from '../../core/typography.js'
import {
  BLOCK1_GRAPH_EDGES,
  BLOCK1_GRAPH_NODES,
  createGraphEdges,
  createGraphNodes,
  OUTPUT_CATEGORIES,
} from './block1Graph.js'
import { BLOCK1_RUNTIME } from './block1Runtime.js'

export {
  BLOCK1_GRAPH_EDGES,
  BLOCK1_GRAPH_NODES,
  createGraphEdges,
  createGraphNodes,
  OUTPUT_CATEGORIES,
}

const { layout: BLOCK1_LAYOUT } = BLOCK1_RUNTIME
const RESEARCH_PHASE = BLOCK1_CONFIG.phases.research
const OUTPUT_PHASE = BLOCK1_CONFIG.phases.scientificOutput
const CONVERSION_PHASE = BLOCK1_CONFIG.phases.conversionTool
const GRAPH_PHASE = BLOCK1_CONFIG.phases.knowledgeGraph
const CATEGORY_COLORS = BLOCK1_CONFIG.theme.categories
const THEME_COLORS = BLOCK1_CONFIG.theme.colors
const GLOW_LAYERS = BLOCK1_CONFIG.theme.effects.glow.layers

export function getOutputCopyArrivalFrame({ durationFrames, category }) {
  const categoryIndex = OUTPUT_CATEGORIES.indexOf(category)
  const animation = CONVERSION_PHASE.animation
  const staggeredArrival =
    Math.round(durationFrames * animation.outputArrivalProgress) +
    categoryIndex * animation.outputArrivalStaggerFrames

  return Math.min(
    durationFrames - animation.outputArrivalEndPaddingFrames,
    Math.max(animation.minimumOutputArrivalFrame, staggeredArrival),
  )
}


function getOutputPosition(category, state) {
  if (state === 'scattered') {
    return BLOCK1_LAYOUT.scatteredIcons[category]
  }

  if (state === 'researchProcess') {
    return BLOCK1_LAYOUT.researchProcess.iconNodeCenters[category]
  }

  return [
    BLOCK1_LAYOUT.outputRow.xByCategory[category],
    BLOCK1_LAYOUT.outputRow.y,
  ]
}

function assetSize(assetId) {
  return ASSET_SIZE_BY_ID[assetId]
}

export function createResearcherLayers({
  durationFrames,
  animateIn = false,
}) {
  const researcherAssetId =
    BLOCK1_CONFIG.assets[RESEARCH_PHASE.researcher.assetId].lottieId
  const researcherAssetSize = assetSize(researcherAssetId)
  const entrance = RESEARCH_PHASE.entrance
  const scale = animateIn
    ? transitionKeyframes(
        [entrance.startScalePercent, entrance.startScalePercent],
        [100, 100],
        0,
        entrance.scaleDurationFrames,
      )
    : [100, 100]
  const opacity = animateIn
    ? transitionKeyframes(0, 100, 0, entrance.opacityDurationFrames)
    : 100

  return [
    imageLayer({
      name: 'Researcher',
      assetId: researcherAssetId,
      assetSize: researcherAssetSize,
      displaySize: displaySizeFromWidth(
        researcherAssetSize,
        BLOCK1_LAYOUT.researcherWidth,
      ),
      position: BLOCK1_LAYOUT.researcher,
      scale,
      opacity,
      durationFrames,
    }),
  ]
}

function researchProcessRevealOpacity(nodeIndex, animateIn) {
  if (!animateIn) {
    return 100
  }

  const animation = RESEARCH_PHASE.process.animation
  const startFrame = (nodeIndex - 1) * animation.nodeRevealFrameGap

  return transitionKeyframes(
    0,
    100,
    startFrame,
    startFrame + animation.nodeRevealDurationFrames,
  )
}

export function createResearchProcessLayers({
  durationFrames,
  animateIn = false,
}) {
  const process = RESEARCH_PHASE.process
  const animation = process.animation
  const centers = BLOCK1_LAYOUT.researchProcess.nodeCenters
  const titleOpacity = animateIn
    ? transitionKeyframes(0, 100, 0, animation.nodeRevealDurationFrames)
    : 100
  const nodeLayers = process.nodes.flatMap((node) => {
    const position = centers[node.index - 1]
    const opacity = researchProcessRevealOpacity(node.index, animateIn)

    if (node.type === 'icon') {
      const assetId = OUTPUT_ASSET_BY_CATEGORY[node.category]

      return [
        imageLayer({
          name: `Research process ${node.category} icon node ${node.index}`,
          assetId,
          assetSize: assetSize(assetId),
          displaySize: [process.outputIconSize, process.outputIconSize],
          position,
          opacity,
          durationFrames,
        }),
      ]
    }

    return [
      circleLayer({
        name: `Research process empty node ${node.index}`,
        radius: process.emptyNode.radius,
        fill: process.emptyNode.fillColor,
        stroke: process.emptyNode.strokeColor,
        strokeWidth: process.emptyNode.strokeWidth,
        position,
        opacity,
        durationFrames,
      }),
    ]
  })
  const edgeLayers = centers.slice(0, -1).map((from, edgeIndex) => {
    const drawStartFrame = animateIn
      ? (edgeIndex + 1) * animation.nodeRevealFrameGap
      : 0

    const layer = edgeLayer({
      name: `Research process edge ${edgeIndex + 1}`,
      from,
      to: centers[edgeIndex + 1],
      color: process.edge.color,
      thickness: process.edge.thickness,
      strokeOpacity: process.edge.opacity,
      durationFrames,
      drawStartFrame,
      drawEndFrame: animateIn
        ? drawStartFrame + animation.edgeDrawDurationFrames
        : 1,
    })

    if (!animateIn) {
      return {
        ...layer,
        shapes: layer.shapes.filter((shape) => shape.ty !== 'tm'),
      }
    }

    return layer
  })

  return [
    textLayer({
      name: 'Research process title',
      text: process.title.text,
      position: BLOCK1_LAYOUT.researchProcess.title,
      fontSize: process.title.fontSize,
      color: process.title.color,
      align: 'center',
      opacity: titleOpacity,
      durationFrames,
    }),
    ...nodeLayers,
    ...edgeLayers,
    rectangleLayer({
      name: 'Research process knockout',
      width: BLOCK1_LAYOUT.researchProcess.knockout.width,
      height: BLOCK1_LAYOUT.researchProcess.knockout.height,
      radius: process.knockout.cornerRadius,
      fill: process.knockout.fillColor,
      stroke: null,
      strokeWidth: 0,
      position: BLOCK1_LAYOUT.researchProcess.knockout.center,
      opacity: titleOpacity,
      durationFrames,
    }),
  ]
}

export function createOutputIconLayers({
  durationFrames,
  fromState,
  toState = fromState,
  animateIn = false,
  copies = false,
  consume = false,
}) {
  const artifact = OUTPUT_PHASE.artifact
  const label = artifact.label
  const animation = OUTPUT_PHASE.animation
  return OUTPUT_CATEGORIES.flatMap((category, index) => {
    const start = getOutputPosition(category, fromState)
    const end = consume
      ? BLOCK1_LAYOUT.conversionTool.inputCenters[category]
      : getOutputPosition(category, toState)
    const movesFromResearchProcess =
      fromState === 'researchProcess' && toState !== fromState && !copies
    const startFrame = animateIn
      ? animation.animateInStartFrame + index * animation.animateInStaggerFrames
      : index * animation.defaultStartStaggerFrames
    const endFrame = consume
      ? getOutputCopyArrivalFrame({ durationFrames, category })
      : Math.min(
          animation.moveEndFrame,
          durationFrames - animation.moveEndPaddingFrames,
        )
    const position =
      start[0] === end[0] && start[1] === end[1]
        ? start
        : transitionKeyframes(start, end, startFrame, endFrame)
    const popScale = animateIn
      ? transitionKeyframes(
          [animation.popStartScalePercent, animation.popStartScalePercent],
          [100, 100],
          startFrame,
          startFrame + animation.popDurationFrames,
        )
      : [100, 100]
    const processIconScale =
      (RESEARCH_PHASE.process.outputIconSize /
        BLOCK1_LAYOUT.outputRow.iconSize) *
      100
    const iconScale = movesFromResearchProcess
      ? transitionKeyframes(
          [processIconScale, processIconScale],
          [100, 100],
          startFrame,
          endFrame,
        )
      : popScale
    const opacity = animateIn
      ? transitionKeyframes(
          0,
          100,
          startFrame,
          startFrame + animation.opacityDurationFrames,
        )
      : consume
        ? transitionKeyframes(
            100,
            0,
            endFrame - animation.consumeFadeDurationFrames,
            endFrame,
          )
        : 100
    const tileOpacity = movesFromResearchProcess
      ? transitionKeyframes(
          0,
          100,
          endFrame - animation.tileRevealDurationFrames,
          endFrame,
        )
      : opacity
    const prefix = copies ? 'Output copy' : 'Output'
    const tileSize = copies
      ? BLOCK1_LAYOUT.outputRow.copyTileSize
      : BLOCK1_LAYOUT.outputRow.tileSize
    const iconSize = copies
      ? BLOCK1_LAYOUT.outputRow.copyIconSize
      : BLOCK1_LAYOUT.outputRow.iconSize
    const cornerRadius = copies
      ? OUTPUT_PHASE.copy.cornerRadius
      : artifact.cornerRadius
    const assetId = OUTPUT_ASSET_BY_CATEGORY[category]
    const categoryColor = CATEGORY_COLORS[category]
    const tilePosition = movesFromResearchProcess ? end : position
    const labelBasePosition = movesFromResearchProcess ? end : position
    const offsetPosition = (basePosition, xOffset, yOffset) =>
      Array.isArray(basePosition?.[0]?.s)
        ? basePosition.map((keyframe) => ({
          ...keyframe,
          s: keyframe.s
            ? [
                keyframe.s[0] + xOffset,
                keyframe.s[1] + yOffset,
              ]
            : keyframe.s,
          e: keyframe.e
            ? [
                keyframe.e[0] + xOffset,
                keyframe.e[1] + yOffset,
              ]
            : keyframe.e,
        }))
        : [
            basePosition[0] + xOffset,
            basePosition[1] + yOffset,
          ]
    const labelPosition = offsetPosition(
      labelBasePosition,
      label.textOffset[0],
      label.textOffset[1],
    )
    const knockoutPosition = offsetPosition(
      labelBasePosition,
      label.knockoutOffset[0],
      label.knockoutOffset[1],
    )

    return [
      imageLayer({
        name: `${prefix} ${category} icon`,
        assetId,
        assetSize: assetSize(assetId),
        displaySize: [iconSize, iconSize],
        position,
        scale: iconScale,
        opacity,
        durationFrames,
      }),
      ...(!copies
        ? [
            textLayer({
              name: `${prefix} ${category} label`,
              text: category.toUpperCase(),
              position: labelPosition,
              fontSize: label.fontSize,
              color: THEME_COLORS.ink,
              align: 'center',
              boxSize: [
                label.textBoxSize[0],
                label.textBoxSize[1],
              ],
              boxPosition: [
                -label.textBoxSize[0] / 2,
                -label.textBoxSize[1] / 2,
              ],
              opacity: tileOpacity,
              durationFrames,
            }),
            rectangleLayer({
              name: `${prefix} ${category} label knockout`,
              width: label.knockoutSize[0],
              height: label.knockoutSize[1],
              radius: label.knockoutCornerRadius,
              fill: THEME_COLORS.background,
              stroke: null,
              strokeWidth: 0,
              position: knockoutPosition,
              opacity: tileOpacity,
              durationFrames,
            }),
          ]
        : []),
      rectangleLayer({
        name: `${prefix} ${category} tile`,
        width: tileSize,
        height: tileSize,
        radius: cornerRadius,
        fill: hexToRgba(THEME_COLORS.background, 0),
        stroke: categoryColor,
        strokeWidth: artifact.borderWidth,
        position: tilePosition,
        scale: popScale,
        opacity: tileOpacity,
        durationFrames,
      }),
      ...(!copies
        ? GLOW_LAYERS.map((glow, glowIndex) =>
            rectangleLayer({
              name: `${prefix} ${category} glow ${glowIndex + 1}`,
              width: tileSize,
              height: tileSize,
              radius: cornerRadius,
              fill: hexToRgba(THEME_COLORS.background, 0),
              stroke: categoryColor,
              strokeWidth: glow.width,
              strokeOpacity: glow.opacity,
              position: tilePosition,
              scale: popScale,
              opacity: tileOpacity,
              durationFrames,
            }),
          )
        : []),
    ]
  })
}

export function createOutputContainerLayers({
  durationFrames,
  animateIn = false,
}) {
  const animation = OUTPUT_PHASE.animation
  const opacity = animateIn
    ? transitionKeyframes(
        0,
        100,
        animation.panelRevealStartFrame,
        animation.panelRevealEndFrame,
      )
    : 100
  const output = OUTPUT_PHASE.panel
  const panel = BLOCK1_LAYOUT.scientificOutput

  return [
    textLayer({
      name: 'Scientific Output label',
      text: output.title.text,
      position: panel.title,
      fontSize: output.title.fontSize,
      fontName: getLottieFontByWeight(output.title.fontWeight).name,
      color: output.title.color,
      align: 'center',
      opacity,
      durationFrames,
    }),
    rectangleLayer({
      name: 'Scientific Output container',
      width: panel.width,
      height: panel.height,
      radius: output.cornerRadius,
      fill: hexToRgba(THEME_COLORS.background, 0),
      stroke: null,
      strokeWidth: output.borderWidth,
      gradientStroke: {
        start: [-panel.width / 2, -panel.height / 2],
        end: [panel.width / 2, panel.height / 2],
        stops: output.strokeGradient,
      },
      position: panel.center,
      opacity,
      durationFrames,
    }),
  ]
}

export function createConversionToolLayers({
  durationFrames,
  includeInputs = true,
  titleRevealFrames = null,
  inputsRevealFrames = null,
  processing = false,
  completed = false,
  connectorMode = processing || completed ? 'static' : 'hidden',
}) {
  const revealOpacity = (frames) =>
    frames
      ? transitionKeyframes(
          0,
          100,
          frames.startFrame,
          frames.endFrame,
        )
      : 100
  const titleOpacity = revealOpacity(titleRevealFrames)
  const inputsOpacity = revealOpacity(inputsRevealFrames)
  const tool = CONVERSION_PHASE
  const inputs = tool.inputs
  const connectors = tool.connectors
  const process = tool.process
  const processInactiveFont = getLottieFontByWeight(
    process.inactiveFontWeight,
  )
  const processActiveFont = getLottieFontByWeight(
    process.activeFontWeight,
  )

  const inputLayers = OUTPUT_CATEGORIES.flatMap((category) => {
    const inputPosition =
      BLOCK1_LAYOUT.conversionTool.inputCenters[category]
    const portPosition = BLOCK1_LAYOUT.conversionTool.inputPorts[category]
    const color = CATEGORY_COLORS[category]

    return [
      textLayer({
        name: `Conversion input ${category} label`,
        text: category.toUpperCase(),
        position: [
          inputPosition[0],
          inputPosition[1] + inputs.labelYOffset,
        ],
        fontSize: inputs.labelFontSize,
        fontName: LOTTIE_MONO_FONT.name,
        color,
        align: 'center',
        boxSize: [inputs.width, inputs.height],
        boxPosition: [-inputs.width / 2, -inputs.height / 2],
        opacity: inputsOpacity,
        durationFrames,
      }),
      circleLayer({
        name: `Conversion input ${category} port`,
        radius: inputs.portRadius,
        fill: color,
        stroke: null,
        strokeWidth: 0,
        position: portPosition,
        opacity: inputsOpacity,
        durationFrames,
      }),
      rectangleLayer({
        name: `Conversion input ${category} box`,
        width: inputs.width,
        height: inputs.height,
        radius: inputs.cornerRadius,
        fill: THEME_COLORS.background,
        stroke: color,
        strokeWidth: inputs.borderWidth,
        position: inputPosition,
        opacity: inputsOpacity,
        durationFrames,
      }),
      ...GLOW_LAYERS.map((glow, glowIndex) =>
        rectangleLayer({
          name: `Conversion input ${category} glow ${glowIndex + 1}`,
          width: inputs.width,
          height: inputs.height,
          radius: inputs.cornerRadius,
          fill: hexToRgba(THEME_COLORS.background, 0),
          stroke: color,
          strokeWidth: glow.width,
          strokeOpacity: glow.opacity,
          position: inputPosition,
          opacity: inputsOpacity,
          durationFrames,
        }),
      ),
      ...(connectorMode === 'hidden'
        ? []
        : [
            curvedPathLayer({
              name: `Conversion connector ${category}`,
              from: portPosition,
              to: BLOCK1_LAYOUT.conversionTool.connectorTarget,
              color,
              thickness: connectors.thickness,
              strokeOpacity: connectors.opacity,
              durationFrames,
              drawStartFrame:
                connectorMode === 'growing'
                  ? getOutputCopyArrivalFrame({ durationFrames, category })
                  : 0,
              drawEndFrame:
                connectorMode === 'growing'
                  ? Math.min(
                      getOutputCopyArrivalFrame({
                        durationFrames,
                        category,
                      }) + connectors.drawDurationFrames,
                      durationFrames - 1,
                    )
                  : 0,
            }),
          ]),
    ]
  })

  const processRailLayers =
    processing || completed
      ? process.items
        .map((item) => ({
          ...item,
          x:
            item.type === 'arrow'
              ? BLOCK1_LAYOUT.conversionTool.processRail.arrowX[
                  item.key === 'parse-normalize'
                    ? 'parseNormalize'
                    : 'normalizeValidate'
                ]
              : BLOCK1_LAYOUT.conversionTool.processRail.statusX[item.key],
        }))
        .flatMap((item) => {
          const baseLayer = textLayer({
            name: `Process ${item.type} ${item.key} base`,
            text: item.text,
            position: [item.x, BLOCK1_LAYOUT.conversionTool.processRail.y],
            fontSize: process.fontSize,
            fontName: processInactiveFont.name,
            color: process.inactiveColor,
            align: 'center',
            opacity: 100,
            durationFrames,
          })
          const activeLayer = textLayer({
            name: `Process ${item.type} ${item.key} active`,
            text: item.text,
            position: [item.x, BLOCK1_LAYOUT.conversionTool.processRail.y],
            fontSize: process.fontSize,
            fontName: processActiveFont.name,
            color: process.activeColor,
            align: 'center',
            opacity: 100,
            durationFrames,
          })

          if (completed) {
            return [activeLayer]
          }

          return [
            { ...baseLayer, op: item.activationFrame },
            { ...activeLayer, ip: item.activationFrame },
          ]
        })
      : []

  return [
    ...processRailLayers,
    ...(includeInputs ? inputLayers : []),
    textLayer({
      name: 'Conversion Tool title',
      text: tool.title.text,
      position: BLOCK1_LAYOUT.conversionTool.title,
      fontSize: tool.title.fontSize,
      fontName: getLottieFontByWeight(tool.title.fontWeight).name,
      color: tool.title.color,
      align: 'center',
      opacity: titleOpacity,
      durationFrames,
    }),
  ]
}

export function createGraphNodeLayers({
  durationFrames,
  animateIn = false,
}) {
  const visual = GRAPH_PHASE.node
  const title = visual.title
  const animation = GRAPH_PHASE.animation

  return BLOCK1_GRAPH_NODES.flatMap((node, index) => {
    const startFrame = animateIn
      ? animation.nodeStartFrame + index * animation.nodeStaggerFrames
      : 0
    const endFrame = animateIn
      ? Math.min(
          startFrame + animation.nodeTravelDurationFrames,
          durationFrames - OUTPUT_PHASE.animation.moveEndPaddingFrames,
        )
      : 0
    const scale = animateIn
      ? transitionKeyframes(
          [animation.nodeStartScalePercent, animation.nodeStartScalePercent],
          [100, 100],
          startFrame,
          endFrame,
        )
      : [100, 100]
    const opacity = animateIn
      ? transitionKeyframes(
          0,
          100,
          startFrame,
          startFrame + animation.nodeOpacityDurationFrames,
        )
      : 100
    const animatedPosition = (finalPosition) =>
      animateIn
        ? transitionKeyframes(
            BLOCK1_LAYOUT.conversionTool.launch,
            finalPosition,
            startFrame,
            endFrame,
          )
        : finalPosition
    const iconPosition = node.position
    const knockoutPosition = [
      node.position[0] + title.knockoutOffset[0],
      node.position[1] + title.knockoutOffset[1],
    ]
    const titlePosition = [
      node.position[0] + title.textOffset[0],
      node.position[1] + title.textOffset[1],
    ]
    const iconAssetId = GRAPH_ICON_ASSET_BY_NAME[node.icon]

    return [
      textLayer({
        name: `Graph node ${node.id} title`,
        text: node.title,
        position: animatedPosition(titlePosition),
        fontSize: title.fontSize,
        fontName: getLottieFontByWeight(title.fontWeight).name,
        color: THEME_COLORS.ink,
        align: 'center',
        boxSize: title.textBoxSize,
        boxPosition: [
          -title.textBoxSize[0] / 2,
          -title.textBoxSize[1] / 2,
        ],
        scale,
        opacity,
        durationFrames,
      }),
      rectangleLayer({
        name: `Graph node ${node.id} title knockout`,
        width: title.knockoutSize[0],
        height: title.knockoutSize[1],
        radius: title.knockoutCornerRadius,
        fill: visual.bodyColor,
        stroke: null,
        strokeWidth: 0,
        position: animatedPosition(knockoutPosition),
        scale,
        opacity,
        durationFrames,
      }),
      imageLayer({
        name: `Graph node ${node.id} icon`,
        assetId: iconAssetId,
        assetSize: assetSize(iconAssetId),
        displaySize: [visual.iconSize, visual.iconSize],
        position: animatedPosition(iconPosition),
        scale,
        opacity,
        durationFrames,
      }),
      circleLayer({
        name: `Graph node ${node.id} circle`,
        radius: visual.diameter / 2,
        fill: visual.bodyColor,
        stroke: node.strokeColor,
        strokeWidth: visual.borderWidth,
        position: animatedPosition(node.position),
        scale,
        opacity,
        durationFrames,
      }),
      ...GLOW_LAYERS.map((glow, glowIndex) =>
        circleLayer({
          name: `Graph node ${node.id} glow ${glowIndex + 1}`,
          radius: visual.diameter / 2,
          fill: visual.bodyColor,
          stroke: node.strokeColor,
          strokeWidth: glow.width,
          strokeOpacity: glow.opacity,
          position: animatedPosition(node.position),
          scale,
          opacity,
          durationFrames,
        }),
      ),
    ]
  })
}

export function createGraphEdgeLayers({
  durationFrames,
  animateIn = false,
}) {
  const nodeById = new Map(
    BLOCK1_GRAPH_NODES.map((node) => [node.id, node]),
  )

  const drawDuration = GRAPH_PHASE.animation.edgeDrawDurationFrames
  const availableStartFrames = Math.max(
    durationFrames - drawDuration - 1,
    0,
  )
  const lastEdgeIndex = Math.max(BLOCK1_GRAPH_EDGES.length - 1, 1)

  return BLOCK1_GRAPH_EDGES.map((edge, index) => {
    const drawStartFrame = animateIn
      ? (index / lastEdgeIndex) * availableStartFrames
      : 0

    return edgeLayer({
      name: `Graph edge ${edge.id}`,
      from: nodeById.get(edge.from).position,
      to: nodeById.get(edge.to).position,
      color: THEME_COLORS.edge,
      thickness: edge.thickness,
      strokeOpacity: GRAPH_PHASE.edge.opacity,
      durationFrames,
      drawStartFrame,
      drawEndFrame: animateIn ? drawStartFrame + drawDuration : 0,
    })
  })
}
