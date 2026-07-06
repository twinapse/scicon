import {
  circleLayer,
  curvedPathLayer,
  edgeLayer,
  imageLayer,
  rectangleLayer,
  textLayer,
  transitionKeyframes,
} from '../../core/lottieHelpers.js'
import { hexToRgba } from '../../core/colors.js'
import { BLOCK2_CONFIG } from '../../config/block2Config.js'
import {
  BLOCK1_GRAPH_EDGES,
  BLOCK1_GRAPH_NODES,
} from '../block1-scientific-output/block1Graph.js'
import {
  createGraphEdgeLayers as createBlock1GraphEdgeLayers,
  createGraphNodeLayers as createBlock1GraphNodeLayers,
} from '../block1-scientific-output/block1Scene.js'
import {
  BLOCK2_ASSET_SIZE_BY_ID,
  BLOCK2_LOTTIE_ID_BY_ASSET_ID,
} from './block2Assets.js'
import { BLOCK2_RUNTIME } from './block2Runtime.js'

const CONFIG = BLOCK2_CONFIG
const RUNTIME = BLOCK2_RUNTIME
const CONNECTION = CONFIG.phases.userConnection
const QUERY = CONFIG.phases.userQuery
const MCP = CONFIG.phases.mcpInteraction
const GRAPH = CONFIG.phases.graphAccess
const COLORS = CONFIG.theme.colors

function opacityProperty(value) {
  return Array.isArray(value?.[0]?.s)
    ? { a: 1, k: value }
    : { a: 0, k: value }
}

function fadeLayer(layer, opacity) {
  return {
    ...layer,
    ks: {
      ...layer.ks,
      o: opacityProperty(opacity),
    },
  }
}

function activationOpacityKeyframes({ startFrame, endFrame }, durationFrames) {
  const keyframes = [{ t: 0, s: [startFrame === 0 ? 100 : 0], h: 1 }]
  if (startFrame > 0) keyframes.push({ t: startFrame, s: [100], h: 1 })
  if (endFrame < durationFrames) {
    keyframes.push({ t: endFrame, s: [0], h: 1 })
  }
  return keyframes
}

function assetSize(assetId) {
  return BLOCK2_ASSET_SIZE_BY_ID[BLOCK2_LOTTIE_ID_BY_ASSET_ID[assetId]]
}

function glowEdgeLayers({
  name,
  from,
  to,
  color,
  thickness,
  strokeOpacity,
  durationFrames,
  drawStartFrame = 0,
  drawEndFrame = 0,
  glowLayers = CONFIG.theme.effects.glow.layers,
}) {
  return [
    ...glowLayers.map((glow, index) =>
      edgeLayer({
        name: `${name} glow ${index + 1}`,
        from,
        to,
        color,
        thickness: glow.width,
        strokeOpacity: glow.opacity,
        durationFrames,
        drawStartFrame,
        drawEndFrame,
      }),
    ),
    edgeLayer({
      name,
      from,
      to,
      color,
      thickness,
      strokeOpacity,
      durationFrames,
      drawStartFrame,
      drawEndFrame,
    }),
  ]
}

function glowCurvedPathLayers({
  name,
  from,
  to,
  fromHandleOffset,
  toHandleOffset,
  color,
  thickness,
  strokeOpacity,
  durationFrames,
  drawStartFrame = 0,
  drawEndFrame = 0,
}) {
  const shared = {
    from,
    to,
    fromHandleOffset,
    toHandleOffset,
    color,
    durationFrames,
    drawStartFrame,
    drawEndFrame,
  }

  return [
    ...CONFIG.theme.effects.glow.layers.map((glow, index) =>
      curvedPathLayer({
        ...shared,
        name: `${name} glow ${index + 1}`,
        thickness: glow.width,
        strokeOpacity: glow.opacity,
      }),
    ),
    curvedPathLayer({
      ...shared,
      name,
      thickness,
      strokeOpacity,
    }),
  ]
}

function compactNodeLayers({
  node,
  durationFrames,
  position = node.position,
  scale,
  opacity = 100,
  namePrefix = 'Compact graph node',
  fill = COLORS.background,
  glowLayers = CONFIG.theme.effects.glow.layers,
  stroke = node.color,
}) {
  const graph = GRAPH.compactGraph
  return [
    ...glowLayers.map((glow, index) =>
      circleLayer({
        name: namePrefix === 'Compact graph node'
          ? `Compact node glow ${node.id} ${index + 1}`
          : `${namePrefix} glow ${node.id} ${index + 1}`,
        radius: graph.nodeDiameter / 2,
        fill,
        stroke,
        strokeWidth: glow.width,
        strokeOpacity: glow.opacity,
        position,
        scale,
        opacity,
        durationFrames,
      }),
    ),
    circleLayer({
      name: `${namePrefix} ${node.id}`,
      radius: graph.nodeDiameter / 2,
      fill,
      stroke,
      strokeWidth: graph.nodeBorderWidth,
      position,
      scale,
      opacity,
      durationFrames,
    }),
  ]
}

export function createCompactGraphLayers({
  durationFrames,
  animateEdges = false,
  inactive = false,
}) {
  const graph = GRAPH.compactGraph
  const inactiveStyle = GRAPH.activation.inactiveGraph
  const nodeById = new Map(
    RUNTIME.compactGraph.nodes.map((node) => [node.id, node]),
  )
  const nodeLayers = RUNTIME.compactGraph.nodes.flatMap((node) =>
    compactNodeLayers({
      node,
      durationFrames,
      stroke: inactive ? inactiveStyle.color : node.color,
      glowLayers: inactive ? [] : CONFIG.theme.effects.glow.layers,
    }),
  )
  const edgeLayers = RUNTIME.compactGraph.edges.map((edge) =>
    edgeLayer({
      name: `Compact graph edge ${edge.id}`,
      from: nodeById.get(edge.from).position,
      to: nodeById.get(edge.to).position,
      color: inactive ? inactiveStyle.color : COLORS.edge,
      thickness: graph.edgeThickness,
      strokeOpacity: inactive ? inactiveStyle.edgeOpacity : graph.edgeOpacity,
      durationFrames,
      drawStartFrame: animateEdges
        ? GRAPH.animation.completeEdgeStartFrame
        : 0,
      drawEndFrame: animateEdges
        ? GRAPH.animation.completeEdgeEndFrame
        : 0,
    }),
  )

  return [...nodeLayers, ...edgeLayers]
}

function mixOpaqueColor(foreground, background, backgroundMix) {
  const foregroundRgb = hexToRgba(foreground).slice(0, 3)
  const backgroundRgb = hexToRgba(background).slice(0, 3)
  return foregroundRgb.map((channel, index) =>
    channel * (1 - backgroundMix) + backgroundRgb[index] * backgroundMix,
  )
}

export function createGraphActivationLayers({ durationFrames }) {
  const activationStyle = GRAPH.activation
  const nodeById = new Map(
    RUNTIME.compactGraph.nodes.map((node) => [node.id, node]),
  )

  return RUNTIME.graphActivations.flatMap((activation) => {
    const opacity = activationOpacityKeyframes(activation, durationFrames)
    const rowNumber = activation.rowIndex + 1
    const nodeLayers = activation.nodes.flatMap((node) =>
      compactNodeLayers({
        node,
        durationFrames,
        fill: mixOpaqueColor(
          node.color,
          COLORS.background,
          activationStyle.activeNode.fillBackgroundMix,
        ),
        glowLayers: activationStyle.activeNode.glowLayers,
        opacity,
        namePrefix: `Active compact graph node row ${rowNumber}`,
      }),
    )
    const edgeLayers = activation.edges.flatMap((edge) =>
      glowEdgeLayers({
        name: `Active compact graph edge row ${rowNumber} ${edge.id}`,
        from: nodeById.get(edge.from).position,
        to: nodeById.get(edge.to).position,
        color: activationStyle.activeEdge.color,
        thickness: activationStyle.activeEdge.thickness,
        strokeOpacity: activationStyle.activeEdge.opacity,
        glowLayers: activationStyle.activeEdge.glowLayers,
        durationFrames,
        drawStartFrame: 0,
        drawEndFrame: 0,
      }).map((layer) => fadeLayer(layer, opacity)),
    )
    return [...nodeLayers, ...edgeLayers]
  })
}

export function createCompressionLayers({ durationFrames }) {
  const animation = GRAPH.animation
  const oldFade = transitionKeyframes(
    100,
    0,
    animation.oldContentFadeStartFrame,
    animation.oldContentFadeEndFrame,
  )
  const oldLayers = [
    ...createBlock1GraphNodeLayers({ durationFrames }),
    ...createBlock1GraphEdgeLayers({ durationFrames }),
  ].map((layer) => fadeLayer(layer, oldFade))
  const retainedIds = new Set(
    RUNTIME.compactGraph.nodes.map(({ id }) => id),
  )
  const discardedLayers = BLOCK1_GRAPH_NODES.filter(
    ({ id }) => !retainedIds.has(id),
  ).map((node) =>
    circleLayer({
      name: `Discarded graph node ${node.id}`,
      radius: node.diameter / 2,
      fill: COLORS.background,
      stroke: node.strokeColor,
      strokeWidth: 2,
      position: node.position,
      opacity: oldFade,
      durationFrames,
    }),
  )
  const morphLayers = RUNTIME.compactGraph.nodes.map((node) => {
    const sourceNode = BLOCK1_GRAPH_NODES.find(({ id }) => id === node.id)
    const targetScale =
      (GRAPH.compactGraph.nodeDiameter / sourceNode.diameter) * 100

    return circleLayer({
      name: `Morph retained node ${node.id}`,
      radius: sourceNode.diameter / 2,
      fill: COLORS.background,
      stroke: node.color,
      strokeWidth: GRAPH.compactGraph.nodeBorderWidth,
      position: transitionKeyframes(
        node.sourcePosition,
        node.position,
        animation.nodeMoveStartFrame,
        animation.nodeMoveEndFrame,
      ),
      scale: transitionKeyframes(
        [100, 100],
        [targetScale, targetScale],
        animation.nodeMoveStartFrame,
        animation.nodeMoveEndFrame,
      ),
      opacity: transitionKeyframes(
        100,
        0,
        animation.nodeMoveEndFrame,
        animation.completeEdgeEndFrame,
      ),
      durationFrames,
    })
  })
  const finalNodeOpacity = transitionKeyframes(
    0,
    100,
    animation.nodeMoveEndFrame,
    animation.completeEdgeEndFrame,
  )
  const finalNodeLayers = RUNTIME.compactGraph.nodes.flatMap((node) =>
    compactNodeLayers({
      node,
      durationFrames,
      opacity: finalNodeOpacity,
    }),
  )
  const nodeById = new Map(
    RUNTIME.compactGraph.nodes.map((node) => [node.id, node]),
  )
  const completeEdges = RUNTIME.compactGraph.edges.map((edge) =>
    edgeLayer({
      name: `Compact graph edge ${edge.id}`,
      from: nodeById.get(edge.from).position,
      to: nodeById.get(edge.to).position,
      color: COLORS.edge,
      thickness: GRAPH.compactGraph.edgeThickness,
      strokeOpacity: GRAPH.compactGraph.edgeOpacity,
      durationFrames,
      drawStartFrame: animation.completeEdgeStartFrame,
      drawEndFrame: animation.completeEdgeEndFrame,
    }),
  )

  return [
    ...finalNodeLayers,
    ...morphLayers,
    ...discardedLayers,
    ...oldLayers,
    ...completeEdges,
  ]
}

export function partitionTitleLayers({ titleLayers, zOrder }) {
  if (zOrder === 'frontmost') {
    return { foregroundLayers: titleLayers, localLayers: [] }
  }
  if (zOrder === 'local') {
    return { foregroundLayers: [], localLayers: titleLayers }
  }
  throw new Error(`Unknown character title zOrder: ${zOrder}`)
}

function createCharacterLayers({ durationFrames, animateIn }) {
  const revealFrames = Math.round(
    (CONNECTION.animation.revealDurationMs / 1000) * CONFIG.stage.frameRate,
  )
  const agentStartFrame = Math.round(
    (CONNECTION.animation.agentDelayMs / 1000) * CONFIG.stage.frameRate,
  )
  const edgeStartFrame = Math.round(
    (CONNECTION.animation.edgeDelayMs / 1000) * CONFIG.stage.frameRate,
  )
  const edgeEndFrame =
    edgeStartFrame +
    Math.round(
      (CONNECTION.animation.edgeDrawDurationMs / 1000) * CONFIG.stage.frameRate,
    )
  const createEntrance = (startFrame) => ({
    opacity: animateIn
      ? transitionKeyframes(0, 100, startFrame, startFrame + revealFrames)
      : 100,
    scale: animateIn
      ? transitionKeyframes(
          [
            CONNECTION.animation.startScalePercent,
            CONNECTION.animation.startScalePercent,
          ],
          [100, 100],
          startFrame,
          startFrame + revealFrames,
        )
      : [100, 100],
  })
  const userEntrance = createEntrance(0)
  const agentEntrance = createEntrance(agentStartFrame)
  const userAssetId =
    BLOCK2_LOTTIE_ID_BY_ASSET_ID[CONNECTION.user.icon.assetId]
  const agentAssetId =
    BLOCK2_LOTTIE_ID_BY_ASSET_ID[CONNECTION.agent.icon.assetId]
  const userTitle = CONNECTION.user.title
  const agentTitle = CONNECTION.agent.title
  const userImageLayer = imageLayer({
      name: 'User',
      assetId: userAssetId,
      assetSize: assetSize(CONNECTION.user.icon.assetId),
      displaySize: [
        CONNECTION.user.icon.displayWidth,
        CONNECTION.user.icon.displayWidth *
          (assetSize(CONNECTION.user.icon.assetId)[1] /
            assetSize(CONNECTION.user.icon.assetId)[0]),
      ],
      position: RUNTIME.layout.user.center,
      ...userEntrance,
      durationFrames,
    })
  const userTitleLayers = [
    textLayer({
      name: 'User title',
      text: userTitle.text,
      position: RUNTIME.layout.user.titleCenter,
      fontSize: userTitle.fontSize,
      color: userTitle.color,
      align: 'center',
      boxSize: userTitle.textBoxSize,
      boxPosition: [
        -userTitle.textBoxSize[0] / 2,
        -userTitle.textBoxSize[1] / 2,
      ],
      opacity: userEntrance.opacity,
      durationFrames,
    }),
    rectangleLayer({
      name: 'User title knockout',
      width: userTitle.knockout.size[0],
      height: userTitle.knockout.size[1],
      radius: userTitle.knockout.cornerRadius,
      fill: userTitle.knockout.fillColor,
      stroke: null,
      strokeWidth: 0,
      position: RUNTIME.layout.user.knockoutCenter,
      opacity: userEntrance.opacity,
      durationFrames,
    }),
  ]
  const agentImageLayer = imageLayer({
      name: 'LLM Agent',
      assetId: agentAssetId,
      assetSize: assetSize(CONNECTION.agent.icon.assetId),
      displaySize: [
        CONNECTION.agent.icon.displayWidth,
        CONNECTION.agent.icon.displayWidth,
      ],
      position: RUNTIME.layout.agent.center,
      ...agentEntrance,
      durationFrames,
    })
  const agentTitleLayers = [
    textLayer({
      name: 'LLM Agent title',
      text: agentTitle.text,
      position: RUNTIME.layout.agent.titleCenter,
      fontSize: agentTitle.fontSize,
      color: agentTitle.color,
      align: 'center',
      boxSize: agentTitle.textBoxSize,
      boxPosition: [
        -agentTitle.textBoxSize[0] / 2,
        -agentTitle.textBoxSize[1] / 2,
      ],
      opacity: agentEntrance.opacity,
      durationFrames,
    }),
    rectangleLayer({
      name: 'LLM Agent title knockout',
      width: agentTitle.knockout.size[0],
      height: agentTitle.knockout.size[1],
      radius: agentTitle.knockout.cornerRadius,
      fill: agentTitle.knockout.fillColor,
      stroke: null,
      strokeWidth: 0,
      position: RUNTIME.layout.agent.knockoutCenter,
      opacity: agentEntrance.opacity,
      durationFrames,
    }),
  ]
  const userPlacement = partitionTitleLayers({
    titleLayers: userTitleLayers,
    zOrder: userTitle.zOrder,
  })
  const agentPlacement = partitionTitleLayers({
    titleLayers: agentTitleLayers,
    zOrder: agentTitle.zOrder,
  })
  const edgeLayers = glowCurvedPathLayers({
      name: 'User to agent edge',
      from: RUNTIME.layout.user.connectionPoint,
      to: RUNTIME.layout.agent.connectionPoint,
      fromHandleOffset: CONNECTION.edge.fromHandleOffset,
      toHandleOffset: CONNECTION.edge.toHandleOffset,
      color: CONNECTION.edge.color,
      thickness: CONNECTION.edge.thickness,
      strokeOpacity: CONNECTION.edge.opacity,
      durationFrames,
      drawStartFrame: animateIn ? edgeStartFrame : 0,
      drawEndFrame: animateIn ? edgeEndFrame : 0,
    })

  return {
    foregroundLayers: [
      ...userPlacement.foregroundLayers,
      ...agentPlacement.foregroundLayers,
    ],
    sceneLayers: [
      ...userPlacement.localLayers,
      userImageLayer,
      ...agentPlacement.localLayers,
      agentImageLayer,
      ...edgeLayers,
    ],
  }
}

function createTypewriterLayer({ box, index, durationFrames, animateIn }) {
  const text = QUERY.boxes.text
  const base = textLayer({
    name: `Query typewriter ${index + 1}`,
    text: box.text,
    position: box.textPosition,
    fontSize: text.fontSize,
    color: text.color,
    align: text.align,
    boxSize: text.textBoxSize,
    opacity: animateIn
      ? transitionKeyframes(0, 100, box.startFrame, box.revealEndFrame)
      : 100,
    durationFrames,
  })
  const template = base.t.d.k[0].s
  const documents = animateIn
    ? box.typewriterFrames.map(({ frame, text }) => ({
        t: frame,
        s: { ...template, t: text },
      }))
    : [{ t: 0, s: { ...template, t: box.text } }]

  return {
    ...base,
    t: {
      ...base.t,
      d: { k: documents },
    },
  }
}

export function createQueryLayers({ durationFrames, animateIn }) {
  const userToQueryAnimation = QUERY.userToQueryEdge.animation
  const userToQueryStart = Math.round(
    (QUERY.animation.contentStartDelayMs / 1000) * CONFIG.stage.frameRate,
  )
  const userToQueryEnd =
    userToQueryStart +
    Math.round(
      (userToQueryAnimation.drawDurationMs / 1000) * CONFIG.stage.frameRate,
    )
  const panelStartFrame = Math.round(
    (QUERY.animation.panelDelayMs / 1000) * CONFIG.stage.frameRate,
  )
  const panelEndFrame =
    panelStartFrame +
    Math.round(
      (QUERY.animation.panelRevealDurationMs / 1000) * CONFIG.stage.frameRate,
    )
  const panelOpacity = animateIn
    ? transitionKeyframes(0, 100, panelStartFrame, panelEndFrame)
    : 100
  const thirdStartFrame = RUNTIME.queryBoxes[2].startFrame
  const boxLayers = RUNTIME.queryBoxes.flatMap((box, index) => {
    const position = animateIn
      ? transitionKeyframes(
          [box.position[0] - QUERY.animation.slideDistance, box.position[1]],
          box.position,
          box.startFrame,
          box.revealEndFrame,
        )
      : box.position
    const opacity = animateIn
      ? transitionKeyframes(0, 100, box.startFrame, box.revealEndFrame)
      : 100

    return [
      rectangleLayer({
        name: `Query box ${index + 1}`,
        width: box.size[0],
        height: box.size[1],
        radius: QUERY.boxes.cornerRadius,
        fill: hexToRgba(box.color, QUERY.boxes.fillOpacity),
        stroke: box.color,
        strokeWidth: QUERY.boxes.borderWidth,
        strokeOpacity: QUERY.boxes.borderOpacity,
        position,
        opacity,
        durationFrames,
      }),
      createTypewriterLayer({ box, index, durationFrames, animateIn }),
    ]
  })
  const queryEdgeStart = thirdStartFrame
  const queryEdgeEnd =
    queryEdgeStart +
    Math.round(
      (QUERY.animation.edgeDrawDurationMs / 1000) * CONFIG.stage.frameRate,
    )
  const mirrorY = ([x, y]) => [x, -y]
  const queryFromHandleOffset = QUERY.edge.mirrorUserAgentCurve
    ? mirrorY(CONNECTION.edge.fromHandleOffset)
    : CONNECTION.edge.fromHandleOffset
  const queryToHandleOffset = QUERY.edge.mirrorUserAgentCurve
    ? mirrorY(CONNECTION.edge.toHandleOffset)
    : CONNECTION.edge.toHandleOffset

  return [
    ...boxLayers,
    textLayer({
      name: 'Query title',
      text: QUERY.panel.title.text,
      position: RUNTIME.layout.queryPanel.titleCenter,
      fontSize: QUERY.panel.title.fontSize,
      color: QUERY.panel.title.color,
      align: QUERY.panel.title.align,
      boxSize: QUERY.panel.title.textBoxSize,
      opacity: panelOpacity,
      durationFrames,
    }),
    rectangleLayer({
      name: 'Query panel',
      width: QUERY.panel.size[0],
      height: QUERY.panel.size[1],
      radius: QUERY.panel.cornerRadius,
      fill: hexToRgba(QUERY.panel.fillColor, QUERY.panel.fillOpacity),
      stroke: QUERY.panel.borderColor,
      strokeWidth: QUERY.panel.borderWidth,
      strokeOpacity: QUERY.panel.borderOpacity,
      position: RUNTIME.layout.queryPanel.center,
      opacity: panelOpacity,
      durationFrames,
    }),
    ...glowCurvedPathLayers({
      name: 'Query to agent edge',
      from: RUNTIME.layout.queryPanel.connectionPoint,
      to: RUNTIME.layout.agent.connectionPoint,
      fromHandleOffset: queryFromHandleOffset,
      toHandleOffset: queryToHandleOffset,
      color: QUERY.edge.color,
      thickness: QUERY.edge.thickness,
      strokeOpacity: QUERY.edge.opacity,
      durationFrames,
      drawStartFrame: animateIn ? queryEdgeStart : 0,
      drawEndFrame: animateIn ? queryEdgeEnd : 0,
    }),
    ...glowEdgeLayers({
      name: 'User to query edge',
      from: RUNTIME.layout.user.connectionPoint,
      to: RUNTIME.layout.queryPanel.connectionPoint,
      color: QUERY.userToQueryEdge.color,
      thickness: QUERY.userToQueryEdge.thickness,
      strokeOpacity: QUERY.userToQueryEdge.opacity,
      durationFrames,
      drawStartFrame: animateIn ? userToQueryStart : 0,
      drawEndFrame: animateIn ? userToQueryEnd : 0,
    }),
  ]
}

export function createMcpTableLayers({
  durationFrames,
  animateIn,
  activateRows = false,
}) {
  const table = MCP.table
  const [width, height] = table.size
  const revealEndFrame = Math.round(
    (MCP.animation.tableRevealDurationMs / 1000) * CONFIG.stage.frameRate,
  )
  const tableOpacity = animateIn
    ? transitionKeyframes(0, 100, 0, revealEndFrame)
    : 100
  const left = RUNTIME.layout.mcpTable.left
  const top = RUNTIME.layout.mcpTable.top
  const apiDividerX =
    left + RUNTIME.mcpTable.columns.api.bounds[2]
  const headerBottomY = top + table.headerHeight
  const dividerDrawEndFrame = animateIn ? revealEndFrame : 0
  const dividerLayers = [
    edgeLayer({
      name: 'MCP table column divider',
      from: [apiDividerX, top],
      to: [apiDividerX, top + height],
      color: COLORS.border,
      thickness: 2,
      strokeOpacity: 74,
      durationFrames,
      drawEndFrame: dividerDrawEndFrame,
    }),
    edgeLayer({
      name: 'MCP table header divider',
      from: [left, headerBottomY],
      to: [left + width, headerBottomY],
      color: COLORS.border,
      thickness: 2,
      strokeOpacity: 74,
      durationFrames,
      drawEndFrame: dividerDrawEndFrame,
    }),
    ...RUNTIME.mcpTable.rows.slice(0, -1).map((_, index) => {
      const y = headerBottomY + RUNTIME.layout.mcpTable.rowHeight * (index + 1)
      return edgeLayer({
        name: `MCP table row divider ${index + 1}`,
        from: [left, y],
        to: [left + width, y],
        color: COLORS.border,
        thickness: 1.5,
        strokeOpacity: 55,
        durationFrames,
        drawEndFrame: dividerDrawEndFrame,
      })
    }),
  ].map((layer) => fadeLayer(layer, tableOpacity))

  const rowLayers = RUNTIME.mcpTable.rows.flatMap((row) => {
    const apiCell = row.cells.api
    const descriptionCell = row.cells.description
    return [textLayer({
      name: `MCP API label ${row.category}`,
      text: apiCell.text,
      position: apiCell.textPosition,
      fontSize: apiCell.fontSize,
      lineHeight: apiCell.lineHeight,
      align: apiCell.align,
      color: COLORS.ink,
      boxSize: apiCell.textBoxSize,
      opacity: tableOpacity,
      durationFrames,
    }),
    textLayer({
      name: `MCP API description ${row.category}`,
      text: descriptionCell.text,
      position: descriptionCell.textPosition,
      fontSize: descriptionCell.fontSize,
      lineHeight: descriptionCell.lineHeight,
      align: descriptionCell.align,
      color: COLORS.ink,
      boxSize: descriptionCell.textBoxSize,
      opacity: tableOpacity,
      durationFrames,
    }),
  ]})

  const arrowLayers = RUNTIME.mcpTable.arrows.flatMap((arrow, index) => {
    const drawEndFrame = arrow.startFrame + arrow.durationFrames
    const color = activateRows
      ? GRAPH.activation.inactiveArrowColor
      : MCP.arrows.color
    return [
      curvedPathLayer({
        name: `Agent row arrow ${index + 1}`,
        from: arrow.from,
        to: arrow.to,
        color,
        thickness: MCP.arrows.thickness,
        strokeOpacity: MCP.arrows.opacity,
        durationFrames,
        drawStartFrame: animateIn ? arrow.startFrame : 0,
        drawEndFrame: animateIn ? drawEndFrame : 0,
      }),
      circleLayer({
        name: `Agent row endpoint ${index + 1}`,
        position: arrow.to,
        radius: MCP.arrows.endpointSphereDiameter / 2,
        fill: color,
        stroke: null,
        strokeWidth: 0,
        opacity: animateIn
          ? transitionKeyframes(0, 100, drawEndFrame, drawEndFrame + 2)
          : 100,
        durationFrames,
      }),
    ]
  })
  const activeRowLayers = activateRows
    ? RUNTIME.graphActivations.flatMap((activation) => {
        const index = activation.rowIndex
        const row = RUNTIME.mcpTable.rows[index]
        const arrow = RUNTIME.mcpTable.arrows[index]
        const opacity = activationOpacityKeyframes(activation, durationFrames)
        return [
          fadeLayer(curvedPathLayer({
            name: `Active agent row arrow ${index + 1}`,
            from: arrow.from,
            to: arrow.to,
            color: MCP.arrows.color,
            thickness: MCP.arrows.thickness,
            strokeOpacity: MCP.arrows.opacity,
            durationFrames,
          }), opacity),
          circleLayer({
            name: `Active agent row endpoint ${index + 1}`,
            position: arrow.to,
            radius: MCP.arrows.endpointSphereDiameter / 2,
            fill: MCP.arrows.color,
            stroke: null,
            strokeWidth: 0,
            opacity,
            durationFrames,
          }),
          rectangleLayer({
            name: `Active MCP row highlight ${index + 1}`,
            width,
            height: RUNTIME.layout.mcpTable.rowHeight,
            radius: 0,
            fill: hexToRgba(
              CONFIG.theme.categories[row.category],
              GRAPH.activation.rowHighlightOpacity / 100,
            ),
            stroke: null,
            strokeWidth: 0,
            position: row.center,
            opacity,
            durationFrames,
          }),
        ]
      })
    : []

  const apiHeader = RUNTIME.mcpTable.headerCells.api
  const descriptionHeader = RUNTIME.mcpTable.headerCells.description
  const headerTextLayers = [
    textLayer({
      name: 'MCP API header',
      text: apiHeader.text,
      position: apiHeader.textPosition,
      fontSize: apiHeader.fontSize,
      lineHeight: apiHeader.lineHeight,
      align: apiHeader.align,
      color: COLORS.brightCyan,
      boxSize: apiHeader.textBoxSize,
      opacity: tableOpacity,
      durationFrames,
    }),
    textLayer({
      name: 'MCP Description header',
      text: descriptionHeader.text,
      position: descriptionHeader.textPosition,
      fontSize: descriptionHeader.fontSize,
      lineHeight: descriptionHeader.lineHeight,
      align: descriptionHeader.align,
      color: COLORS.brightCyan,
      boxSize: descriptionHeader.textBoxSize,
      opacity: tableOpacity,
      durationFrames,
    }),
  ]
  const footerTitleLayer = textLayer({
    name: 'MCP footer title',
    text: table.footerTitle.text,
    position: RUNTIME.layout.mcpTable.footerTitleCenter,
    fontSize: table.footerTitle.fontSize,
    align: table.footerTitle.align,
    color: table.footerTitle.color,
    boxSize: table.footerTitle.textBoxSize,
    opacity: tableOpacity,
    durationFrames,
  })

  return [
    ...activeRowLayers.filter(({ nm }) => !nm.startsWith('Active MCP row highlight ')),
    ...arrowLayers,
    ...headerTextLayers,
    ...rowLayers,
    ...dividerLayers,
    ...activeRowLayers.filter(({ nm }) => nm.startsWith('Active MCP row highlight ')),
    footerTitleLayer,
    rectangleLayer({
      name: 'MCP table header',
      width: width - 4,
      height: table.headerHeight - 2,
      radius: table.cornerRadius - 3,
      fill: hexToRgba(table.header.fillColor, table.header.fillOpacity),
      stroke: null,
      strokeWidth: 0,
      position: [RUNTIME.layout.mcpTable.center[0], top + table.headerHeight / 2],
      opacity: tableOpacity,
      durationFrames,
    }),
    rectangleLayer({
      name: 'MCP table panel',
      width,
      height,
      radius: table.cornerRadius,
      fill: hexToRgba(COLORS.panel, 0.4),
      stroke: COLORS.brightCyan,
      strokeWidth: table.borderWidth,
      strokeOpacity: 75,
      position: RUNTIME.layout.mcpTable.center,
      opacity: tableOpacity,
      durationFrames,
    }),
  ]
}

export function createBlock2SceneLayers({
  durationFrames,
  phase,
  animateCurrentPhase = false,
  settled = false,
}) {
  const foregroundLayers = []
  const activeGraphLayers = phase === 'graphAccess' && !settled
    ? createGraphActivationLayers({ durationFrames })
    : []
  const sceneLayers = [...createCompactGraphLayers({
    durationFrames,
    inactive: phase === 'graphAccess' && !settled,
  })]

  if (['userConnection', 'userQuery', 'mcpInteraction', 'graphAccess'].includes(phase)) {
    const characterLayers = createCharacterLayers({
      durationFrames,
      animateIn: phase === 'userConnection' && animateCurrentPhase,
    })
    foregroundLayers.push(...characterLayers.foregroundLayers)
    sceneLayers.push(...characterLayers.sceneLayers)
  }
  if (['userQuery', 'mcpInteraction', 'graphAccess'].includes(phase)) {
    sceneLayers.push(
      ...createQueryLayers({
        durationFrames,
        animateIn: phase === 'userQuery' && animateCurrentPhase,
      }),
    )
  }
  if (['mcpInteraction', 'graphAccess'].includes(phase)) {
    sceneLayers.push(
      ...createMcpTableLayers({
        durationFrames,
        animateIn: phase === 'mcpInteraction' && animateCurrentPhase,
        activateRows: phase === 'graphAccess' && !settled,
      }),
    )
  }

  return [...foregroundLayers, ...activeGraphLayers, ...sceneLayers]
}

export const BLOCK1_GRAPH_EDGE_COUNT = BLOCK1_GRAPH_EDGES.length
