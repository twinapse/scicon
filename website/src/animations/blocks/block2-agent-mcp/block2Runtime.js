import { BLOCK1_GRAPH_NODES } from '../block1-scientific-output/block1Graph.js'
import {
  durationMsToFrames,
} from '../../config/animationBlockSchema.js'
import { BLOCK2_CONFIG } from '../../config/block2Config.js'
import { createSeededRandom } from '../../core/seededRandom.js'

const CATEGORIES = ['paper', 'code', 'data']

function addPosition([x, y], [offsetX, offsetY]) {
  return [x + offsetX, y + offsetY]
}

function toFrame(config, milliseconds) {
  return durationMsToFrames(config, milliseconds)
}

function createTypewriterFrames({
  config,
  text,
  startFrame,
  charactersPerSecond,
}) {
  return Array.from({ length: text.length + 1 }, (_, index) => ({
    frame:
      startFrame +
      Math.round((index / charactersPerSecond) * config.stage.frameRate),
    text: text.slice(0, index),
  }))
}

function assertPointInStage([x, y], stage, name) {
  if (x < 0 || x > stage.width || y < 0 || y > stage.height) {
    throw new Error(`${name} exceeds the ${stage.width}x${stage.height} stage`)
  }
}

export function createCompleteGraphEdges(nodes) {
  if (nodes.length < 2) {
    throw new Error('compact graph requires at least two nodes')
  }

  const edges = []
  for (let first = 0; first < nodes.length; first += 1) {
    for (let second = first + 1; second < nodes.length; second += 1) {
      edges.push({
        id: `compact-edge-${edges.length + 1}`,
        from: nodes[first].id,
        to: nodes[second].id,
      })
    }
  }
  return edges
}

function createCompactGraph(config) {
  const graph = config.phases.graphAccess.compactGraph
  const retainedNodesByCategory = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      BLOCK1_GRAPH_NODES.filter((node) => node.category === category).slice(
        0,
        graph.nodesPerCategory,
      ),
    ]),
  )
  const nodes = []

  CATEGORIES.forEach((category) => {
    const [centerOffsetX, centerOffsetY] = graph.clusterCenterOffsets[category]
    const center = [
      graph.anchor[0] + centerOffsetX,
      graph.anchor[1] + centerOffsetY,
    ]

    retainedNodesByCategory[category].forEach((sourceNode, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / graph.nodesPerCategory
      const position = [
        center[0] + Math.cos(angle) * graph.nodeRingRadius,
        center[1] + Math.sin(angle) * graph.nodeRingRadius,
      ]
      assertPointInStage(position, config.stage, sourceNode.id)
      nodes.push({
        id: sourceNode.id,
        category,
        color: config.theme.categories[category],
        sourcePosition: sourceNode.position,
        position,
      })
    })
  })

  if (nodes.length !== 9) {
    throw new Error('compact graph must contain exactly nine nodes')
  }

  const edges = createCompleteGraphEdges(nodes)
  if (edges.length !== 36) {
    throw new Error('compact graph must contain exactly 36 unique edges')
  }

  return { retainedNodesByCategory, nodes, edges }
}

function selectDeterministicNodes(nodes, count, random) {
  if (!Number.isInteger(count) || count < 1 || count > nodes.length) {
    throw new Error('graph activation category count exceeds available nodes')
  }
  if (count === nodes.length) return [...nodes]

  const shuffled = [...nodes]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled.slice(0, count)
}

function createGraphActivations(config, compactGraph, step) {
  const activation = config.phases.graphAccess.activation
  const tableRows = config.phases.mcpInteraction.table.rows
  if (activation.rows.length !== tableRows.length) {
    throw new Error('graph activations must define one mapping per MCP row')
  }

  const durationFrames = toFrame(config, activation.rowDurationMs)
  if (durationFrames * activation.rows.length !== step.durationFrames) {
    throw new Error('graph activation windows must exactly fill their step')
  }

  const random = createSeededRandom(activation.selectionSeed)
  return activation.rows.map((categoryCounts, rowIndex) => {
    const selectedIds = new Set()
    Object.entries(categoryCounts).forEach(([category, count]) => {
      const categoryNodes = compactGraph.nodes.filter(
        (node) => node.category === category,
      )
      selectDeterministicNodes(categoryNodes, count, random).forEach(({ id }) =>
        selectedIds.add(id),
      )
    })

    const nodes = compactGraph.nodes.filter(({ id }) => selectedIds.has(id))
    const edges = compactGraph.edges.filter(
      ({ from, to }) => selectedIds.has(from) && selectedIds.has(to),
    )
    return {
      rowIndex,
      startFrame: rowIndex * durationFrames,
      endFrame: (rowIndex + 1) * durationFrames,
      nodes,
      edges,
    }
  })
}

function createLayout(config) {
  const connection = config.phases.userConnection
  const query = config.phases.userQuery
  const mcp = config.phases.mcpInteraction
  const [tableWidth, tableHeight] = mcp.table.size
  const tableTop = mcp.anchor[1] - tableHeight / 2
  const tableLeft = mcp.anchor[0] - tableWidth / 2
  const footerTitleCenter = [
    mcp.anchor[0],
    mcp.anchor[1] +
      tableHeight / 2 +
      mcp.table.footerTitle.gap +
      mcp.table.footerTitle.textBoxSize[1] / 2,
  ]
  const apiWidthPercent = mcp.table.columns.api.widthPercent
  if (apiWidthPercent <= 0 || apiWidthPercent >= 100) {
    throw new Error('MCP API column widthPercent must be between 0 and 100')
  }
  const apiColumnWidth = tableWidth * (apiWidthPercent / 100)
  const descriptionColumnWidth = tableWidth - apiColumnWidth
  const rowHeight = (tableHeight - mcp.table.headerHeight) / mcp.table.rows.length
  const rowCenters = mcp.table.rows.map((_, index) => [
    mcp.anchor[0],
    tableTop + mcp.table.headerHeight + rowHeight * (index + 0.5),
  ])
  const userCenter = addPosition(
    connection.anchor,
    connection.user.icon.positionOffset,
  )
  const userTitleCenter = addPosition(
    connection.anchor,
    connection.user.title.positionOffset,
  )
  const agentCenter = addPosition(
    connection.anchor,
    connection.agent.icon.positionOffset,
  )
  const agentTitleCenter = addPosition(
    connection.anchor,
    connection.agent.title.positionOffset,
  )
  const queryPanelCenter = addPosition(
    query.anchor,
    query.panel.positionOffset,
  )
  const queryTitleCenter = addPosition(
    queryPanelCenter,
    query.panel.title.positionOffset,
  )

  return {
    user: {
      center: userCenter,
      connectionPoint: userCenter,
      titleCenter: userTitleCenter,
      knockoutCenter: userTitleCenter,
      edgeOrigin: [
        userCenter[0] + connection.user.icon.displayWidth / 2,
        userCenter[1],
      ],
    },
    agent: {
      center: agentCenter,
      connectionPoint: agentCenter,
      titleCenter: agentTitleCenter,
      knockoutCenter: agentTitleCenter,
      edgeTarget: [
        agentCenter[0] - connection.agent.icon.displayWidth / 2,
        agentCenter[1],
      ],
      edgeOrigin: [
        agentCenter[0] + connection.agent.icon.displayWidth / 2,
        agentCenter[1],
      ],
    },
    queryPanel: {
      center: queryPanelCenter,
      connectionPoint: queryPanelCenter,
      titleCenter: queryTitleCenter,
      top: queryPanelCenter[1] - query.panel.size[1] / 2,
      right: queryPanelCenter[0] + query.panel.size[0] / 2,
    },
    mcpTable: {
      center: mcp.anchor,
      footerTitleCenter,
      left: tableLeft,
      top: tableTop,
      rowHeight,
      rowCenters,
      columns: {
        api: {
          bounds: [tableLeft, tableTop, apiColumnWidth, mcp.table.headerHeight],
        },
        description: {
          bounds: [
            tableLeft + apiColumnWidth,
            tableTop,
            descriptionColumnWidth,
            mcp.table.headerHeight,
          ],
        },
      },
    },
  }
}

export function wrapMcpCellText(text, maximumCharactersPerLine) {
  const lineLimit = Math.max(1, Math.floor(maximumCharactersPerLine))

  return String(text)
    .split('\n')
    .flatMap((paragraph) => {
      if (paragraph.length === 0) return ['']

      const lines = []
      let currentLine = ''
      const appendWord = (word) => {
        if (!currentLine) {
          while (word.length > lineLimit) {
            lines.push(word.slice(0, lineLimit))
            word = word.slice(lineLimit)
          }
          currentLine = word
          return
        }

        if (`${currentLine} ${word}`.length <= lineLimit) {
          currentLine = `${currentLine} ${word}`
          return
        }

        lines.push(currentLine)
        currentLine = ''
        appendWord(word)
      }

      paragraph.split(/\s+/).forEach(appendWord)
      if (currentLine) lines.push(currentLine)
      return lines
    })
}

function createCellTextLayout(bounds, style, text) {
  const [left, top, width, height] = bounds
  const [paddingTop, paddingRight, paddingBottom, paddingLeft] = style.padding
  const innerBounds = [
    left + paddingLeft,
    top + paddingTop,
    Math.max(1, width - paddingLeft - paddingRight),
    Math.max(1, height - paddingTop - paddingBottom),
  ]
  const [innerLeft, innerTop, innerWidth, innerHeight] = innerBounds
  const characterWidth = style.fontSize * style.characterWidthRatio
  const maximumCharactersPerLine = Math.max(
    1,
    Math.floor(innerWidth / characterWidth),
  )
  const wrappedLines = wrapMcpCellText(text, maximumCharactersPerLine)
  const contentHeight = wrappedLines.length * style.lineHeight

  const textX =
    style.align === 'center'
      ? innerLeft + innerWidth / 2
      : style.align === 'right'
        ? innerLeft + innerWidth
        : innerLeft
  const textY =
    style.verticalAlign === 'center'
      ? innerTop + Math.max(0, (innerHeight - contentHeight) / 2)
      : style.verticalAlign === 'bottom'
        ? innerTop + Math.max(0, innerHeight - contentHeight)
        : innerTop

  return {
    bounds,
    innerBounds,
    textPosition: [textX, textY],
    textBoxSize: [innerWidth, Math.min(innerHeight, contentHeight)],
    wrappedLines,
    text: wrappedLines.join('\n'),
    ...style,
  }
}

function createMcpTable(config, layout, arrows) {
  const { table } = config.phases.mcpInteraction
  const columnKeys = ['api', 'description']
  const columns = Object.fromEntries(
    columnKeys.map((key) => [
      key,
      {
        ...layout.mcpTable.columns[key],
        widthPercent:
          key === 'api' ? table.columns.api.widthPercent : 100 - table.columns.api.widthPercent,
      },
    ]),
  )
  const headerCells = Object.fromEntries(
    columnKeys.map((key) => [
      key,
      createCellTextLayout(
        columns[key].bounds,
        table.columns[key].header,
        table.columns[key].header.text,
      ),
    ]),
  )
  const rows = table.rows.map((row, index) => {
    const rowTop =
      layout.mcpTable.top + table.headerHeight + layout.mcpTable.rowHeight * index
    const cells = Object.fromEntries(
      columnKeys.map((key) => {
        const [columnLeft, , columnWidth] = columns[key].bounds
        return [
          key,
          createCellTextLayout(
            [columnLeft, rowTop, columnWidth, layout.mcpTable.rowHeight],
            table.columns[key].cells,
            row[key],
          ),
        ]
      }),
    )

    return {
      ...row,
      center: layout.mcpTable.rowCenters[index],
      cells,
    }
  })

  return { columns, headerCells, rows, arrows }
}

function createQueryBoxes(config, layout, queryStep) {
  const query = config.phases.userQuery
  const contentStartMs = query.animation.contentStartDelayMs
  const [boxWidth, boxHeight] = query.boxes.size
  const contentHeight =
    query.boxes.items.length * boxHeight +
    (query.boxes.items.length - 1) * query.boxes.gap
  const groupCenterY =
    layout.queryPanel.center[1] + query.boxes.groupPositionOffset[1]
  const firstY = groupCenterY - contentHeight / 2 + boxHeight / 2

  return query.boxes.items.map((item, index) => {
    const startFrame = toFrame(
      config,
      contentStartMs + query.animation.boxStaggerMs * index,
    )
    const typewriterFrames = createTypewriterFrames({
      config,
      text: item.text,
      startFrame,
      charactersPerSecond: query.animation.charactersPerSecond,
    })
    if (typewriterFrames.at(-1).frame > queryStep.durationFrames) {
      throw new Error(`query box ${index + 1} typing exceeds its owning step`)
    }

    const position = [
      layout.queryPanel.center[0],
      firstY + index * (boxHeight + query.boxes.gap),
    ]

    return {
      ...item,
      color: config.theme.categories[item.category],
      position,
      textPosition: addPosition(position, query.boxes.text.positionOffset),
      startFrame,
      revealEndFrame:
        startFrame + toFrame(config, query.animation.boxRevealDurationMs),
      typewriterFrames,
      size: [boxWidth, boxHeight],
    }
  })
}

function createMcpArrows(config, layout) {
  const mcp = config.phases.mcpInteraction
  const random = createSeededRandom(mcp.arrows.durationSeed)
  const durationRange =
    mcp.arrows.maximumDurationMs - mcp.arrows.minimumDurationMs

  if (durationRange < 0) {
    throw new Error('MCP arrow maximum duration must be at least its minimum')
  }

  return mcp.table.rows.map((row, index) => {
    const durationMs = Math.round(
      mcp.arrows.minimumDurationMs + random() * durationRange,
    )
    return {
      id: `agent-to-${row.category}-api`,
      category: row.category,
      from: layout.agent.edgeOrigin,
      to: [layout.mcpTable.left, layout.mcpTable.rowCenters[index][1]],
      startFrame: toFrame(config, mcp.animation.arrowStartDelayMs),
      durationMs,
      durationFrames: toFrame(config, durationMs),
    }
  })
}

export function createBlock2Runtime(config = BLOCK2_CONFIG) {
  const stepsById = new Map(
    config.sequence.steps.map((step) => [
      step.id,
      {
        ...step,
        durationFrames: toFrame(config, step.durationMs),
      },
    ]),
  )
  const layout = createLayout(config)
  const compactGraph = createCompactGraph(config)
  const queryBoxes = createQueryBoxes(
    config,
    layout,
    stepsById.get('query-enters'),
  )
  const arrows = createMcpArrows(config, layout)
  const mcpTable = createMcpTable(config, layout, arrows)
  const graphActivations = createGraphActivations(
    config,
    compactGraph,
    stepsById.get('graph-access-activations'),
  )

  return {
    config,
    stage: config.stage,
    stepsById,
    layout,
    retainedNodesByCategory: compactGraph.retainedNodesByCategory,
    compactGraph: {
      nodes: compactGraph.nodes,
      edges: compactGraph.edges,
    },
    queryBoxes,
    mcpTable,
    graphActivations,
  }
}

export function createBlock2AssetCatalog(config, resolveAssetUrl) {
  const lottieAssets = Object.values(config.assets)
    .filter(({ lottieId }) => lottieId)
    .map(({ lottieId: id, path, intrinsicSize: [width, height] }) => ({
      id,
      width,
      height,
      url: resolveAssetUrl(path),
    }))

  return {
    lottieAssets,
    assetSizeById: Object.fromEntries(
      lottieAssets.map(({ id, width, height }) => [id, [width, height]]),
    ),
    lottieIdByAssetId: Object.fromEntries(
      Object.entries(config.assets).map(([assetId, { lottieId }]) => [
        assetId,
        lottieId,
      ]),
    ),
  }
}

export const BLOCK2_RUNTIME = createBlock2Runtime()
