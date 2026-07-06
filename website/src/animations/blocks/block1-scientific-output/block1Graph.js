import { BLOCK1_CONFIG } from '../../config/block1Config.js'
import { hexToRgba } from '../../core/colors.js'
import { createSeededRandom } from '../../core/seededRandom.js'
import { deriveBlock1Layout } from './block1Runtime.js'

export const OUTPUT_CATEGORIES = Object.keys(BLOCK1_CONFIG.theme.categories)

export const GRAPH_NODE_CONTENT = Object.fromEntries(
  Object.entries(BLOCK1_CONFIG.phases.knowledgeGraph.content).map(
    ([category, content]) => [
      category,
      content.map(({ title, icon, role }) => ({ title, icon, role })),
    ],
  ),
)

function shuffleDeterministically(values, seed) {
  const random = createSeededRandom(seed)
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }

  return shuffled
}

function createRingPositions({ center, radius, count, startAngleDegrees }) {
  if (count === 0) {
    return []
  }

  const startAngle = (startAngleDegrees * Math.PI) / 180

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (index * Math.PI * 2) / count

    return [
      center[0] + Math.cos(angle) * radius,
      center[1] + Math.sin(angle) * radius,
    ]
  })
}

function validateProbability(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1.`)
  }
}

function validateContent(category, content) {
  const centralCount = content.filter(({ role }) => role === 'central').length
  const invalidRole = content.find(
    ({ role }) => role !== 'central' && role !== 'ring',
  )

  if (invalidRole) {
    throw new Error(`${category} graph nodes must use central or ring roles.`)
  }

  if (category === 'paper' && centralCount !== 0) {
    throw new Error('paper graph nodes cannot define a central node.')
  }

  if (category !== 'paper' && centralCount !== 1) {
    throw new Error(`${category} graph nodes require exactly one central node.`)
  }
}

function validateNodeBounds(node, graph, stage) {
  const visual = graph.node
  const title = visual.title
  const radius = visual.diameter / 2
  const leftExtent = Math.max(
    radius,
    title.knockoutSize[0] / 2 - title.knockoutOffset[0],
    title.textBoxSize[0] / 2 - title.textOffset[0],
  )
  const rightExtent = Math.max(
    radius,
    title.knockoutSize[0] / 2 + title.knockoutOffset[0],
    title.textBoxSize[0] / 2 + title.textOffset[0],
  )
  const topExtent = Math.max(
    radius,
    title.knockoutSize[1] / 2 - title.knockoutOffset[1],
    title.textBoxSize[1] / 2 - title.textOffset[1],
  )
  const bottomExtent = Math.max(
    radius,
    title.knockoutSize[1] / 2 + title.knockoutOffset[1],
    title.textBoxSize[1] / 2 + title.textOffset[1],
  )
  const [x, y] = node.position

  if (
    x - leftExtent < 0 ||
    x + rightExtent > stage.width ||
    y - topExtent < 0 ||
    y + bottomExtent > stage.height
  ) {
    throw new Error(
      `${node.id} graph node exceeds the ${stage.width}x${stage.height} stage.`,
    )
  }
}

export function createGraphNodes(
  config = BLOCK1_CONFIG,
  contentByCategory = GRAPH_NODE_CONTENT,
) {
  const graph = config.phases.knowledgeGraph
  const clusterCenters = deriveBlock1Layout(config).graph.clusterCenters
  const nodes = []

  OUTPUT_CATEGORIES.forEach((category) => {
    const content = contentByCategory[category] ?? []
    const center = clusterCenters[category]
    const ringContent = content.filter(({ role }) => role === 'ring')
    const ringPositions = createRingPositions({
      center,
      radius: graph.clusters[category].ringRadius,
      count: ringContent.length,
      startAngleDegrees: graph.clusters[category].ringStartAngleDegrees,
    })
    let ringIndex = 0

    validateContent(category, content)

    content.forEach((item, index) => {
      const position =
        item.role === 'central' ? center : ringPositions[ringIndex++]
      const node = {
        id: `${category}-${index + 1}`,
        category,
        ...item,
        color: hexToRgba(
          config.theme.categories[category],
          graph.node.alpha,
        ),
        strokeColor: config.theme.categories[category],
        position,
        diameter: graph.node.diameter,
      }

      validateNodeBounds(node, graph, config.stage)
      nodes.push(node)
    })
  })

  return nodes
}

function createWeightedEdge(from, to, index, random, graph) {
  const weight = Number(
    (
      graph.generation.minimumEdgeWeight +
      random() * (1 - graph.generation.minimumEdgeWeight)
    ).toFixed(3),
  )

  return {
    id: `edge-${index + 1}`,
    from,
    to,
    weight,
    thickness: Number((weight * graph.edge.maximumThickness).toFixed(3)),
  }
}

export function createGraphEdges(
  nodes,
  graph = BLOCK1_CONFIG.phases.knowledgeGraph,
) {
  validateProbability(
    graph.generation.paperExtraEdgeProbability,
    'paperExtraEdgeProbability',
  )
  validateProbability(
    graph.generation.neighborEdgeProbability,
    'neighborEdgeProbability',
  )

  const weightRandom = createSeededRandom(graph.generation.edgeWeightSeed)
  const edges = []
  const seen = new Set()

  function addEdge(from, to) {
    const key = [from, to].sort().join(':')

    if (from === to || seen.has(key)) {
      return false
    }

    seen.add(key)
    edges.push(createWeightedEdge(from, to, edges.length, weightRandom, graph))
    return true
  }

  const paperNodes = nodes.filter(({ category }) => category === 'paper')
  const shuffledPaperNodes = shuffleDeterministically(
    paperNodes,
    graph.generation.paperTreeSeed,
  )
  const paperTreeRandom = createSeededRandom(
    graph.generation.paperTreeLinksSeed,
  )

  for (let index = 1; index < shuffledPaperNodes.length; index += 1) {
    const parentIndex = Math.floor(paperTreeRandom() * index)
    addEdge(shuffledPaperNodes[parentIndex].id, shuffledPaperNodes[index].id)
  }

  const paperExtraRandom = createSeededRandom(
    graph.generation.paperExtrasSeed,
  )
  for (let first = 0; first < paperNodes.length; first += 1) {
    for (let second = first + 1; second < paperNodes.length; second += 1) {
      const key = [paperNodes[first].id, paperNodes[second].id]
        .sort()
        .join(':')

      if (
        !seen.has(key) &&
        paperExtraRandom() < graph.generation.paperExtraEdgeProbability
      ) {
        addEdge(paperNodes[first].id, paperNodes[second].id)
      }
    }
  }

  for (const category of ['code', 'data']) {
    const categoryNodes = nodes.filter((node) => node.category === category)
    const central = categoryNodes.find((node) => node.role === 'central')
    const ring = categoryNodes.filter((node) => node.role === 'ring')

    if (!central) {
      throw new Error(`${category} graph nodes require one central node.`)
    }

    ring.forEach((node) => addEdge(central.id, node.id))

    const neighborRandom = createSeededRandom(
      graph.generation[`${category}NeighborsSeed`],
    )
    const neighborPairs =
      ring.length === 2
        ? [[ring[0], ring[1]]]
        : ring.length > 2
          ? ring.map((node, index) => [node, ring[(index + 1) % ring.length]])
          : []

    neighborPairs.forEach(([from, to]) => {
      if (neighborRandom() < graph.generation.neighborEdgeProbability) {
        addEdge(from.id, to.id)
      }
    })
  }

  const connectionRandom = createSeededRandom(
    graph.generation.clusterConnectionsSeed,
  )
  const clusterPairs = [
    ['paper', 'code'],
    ['paper', 'data'],
    ['code', 'data'],
  ]

  clusterPairs.forEach(([firstCategory, secondCategory]) => {
    const firstNodes = nodes.filter(
      (node) => node.category === firstCategory,
    )
    const secondNodes = nodes.filter(
      (node) => node.category === secondCategory,
    )
    const candidates = firstNodes.flatMap((firstNode) =>
      secondNodes.map((secondNode) => [firstNode.id, secondNode.id]),
    )
    const connectionCount = Math.min(
      graph.generation.minimumConnectionsPerClusterPair,
      candidates.length,
    )

    for (let index = 0; index < connectionCount; index += 1) {
      const candidateIndex = Math.floor(
        connectionRandom() * candidates.length,
      )
      const [from, to] = candidates.splice(candidateIndex, 1)[0]
      addEdge(from, to)
    }
  })

  return edges
}

export const BLOCK1_GRAPH_NODES = createGraphNodes()
export const BLOCK1_GRAPH_EDGES = createGraphEdges(BLOCK1_GRAPH_NODES)
