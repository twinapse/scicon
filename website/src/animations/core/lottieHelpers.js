import { hexToRgba } from './colors.js'
import { LOTTIE_FONT, LOTTIE_FONTS } from './typography.js'

const EASE_OUT = {
  i: { x: [0.25], y: [1] },
  o: { x: [0.35], y: [0] },
}

function hexToRgbUnit(hex) {
  return hexToRgba(hex)
}

function staticValue(value) {
  return { a: 0, k: value }
}

function animatedValue(keyframes) {
  return { a: 1, k: keyframes }
}

export function holdKeyframes(value, endFrame) {
  return [
    { t: 0, s: Array.isArray(value) ? value : [value], h: 1 },
    { t: endFrame, s: Array.isArray(value) ? value : [value], h: 1 },
  ]
}

export function transitionKeyframes(from, to, startFrame, endFrame) {
  const fromValue = Array.isArray(from) ? from : [from]
  const toValue = Array.isArray(to) ? to : [to]

  return [
    {
      t: 0,
      s: fromValue,
      h: 1,
    },
    {
      t: startFrame,
      s: fromValue,
      e: toValue,
      ...EASE_OUT,
    },
    {
      t: endFrame,
      s: toValue,
      h: 1,
    },
  ]
}

function transform({
  position,
  scale = [100, 100],
  opacity = 100,
  rotation = 0,
  anchor = [0, 0, 0],
}) {
  return {
    o: Array.isArray(opacity?.[0]?.s)
      ? animatedValue(opacity)
      : staticValue(opacity),
    r: Array.isArray(rotation?.[0]?.s)
      ? animatedValue(rotation)
      : staticValue(rotation),
    p: Array.isArray(position?.[0]?.s)
      ? animatedValue(position)
      : staticValue(position),
    a: staticValue(anchor),
    s: Array.isArray(scale?.[0]?.s)
      ? animatedValue(scale)
      : staticValue(scale),
  }
}

function baseLayer({ name, type, inFrame, outFrame, transformData }) {
  return {
    ddd: 0,
    ind: 1,
    ty: type,
    nm: name,
    sr: 1,
    ks: transformData,
    ao: 0,
    ip: inFrame,
    op: outFrame,
    st: 0,
    bm: 0,
  }
}

export function createAnimation({
  name,
  durationFrames,
  layers,
  assets = [],
  stage = DEFAULT_STAGE,
}) {
  return {
    v: '5.12.2',
    fr: stage.frameRate,
    ip: 0,
    op: durationFrames,
    w: stage.width,
    h: stage.height,
    nm: name,
    ddd: 0,
    assets: assets.map(({ id, width, height, url }) => ({
      id,
      w: width,
      h: height,
      u: '',
      p: url,
      e: 0,
    })),
    fonts: {
      list: LOTTIE_FONTS.map((font) => ({
        fName: font.name,
        fFamily: font.family,
        fStyle: font.style,
        fWeight: font.weight,
        ascent: font.ascent,
      })),
    },
    layers: layers.map((layer, index) => ({ ...layer, ind: index + 1 })),
  }
}

export function createSequenceAnimation({
  name,
  steps,
  persistentLayers = [],
  precompLayerFilter = () => true,
  stage = DEFAULT_STAGE,
}) {
  const imageAssets = new Map()
  const precompAssets = []
  let startFrame = 0

  const layers = steps.map((step, index) => {
    const animation = step.animationData
    const durationFrames = animation.op - animation.ip
    const precompId = `sequence-${step.id}`

    animation.assets.forEach((asset) => {
      if (!asset.layers) {
        imageAssets.set(asset.id, asset)
      }
    })

    precompAssets.push({
      id: precompId,
      w: animation.w,
      h: animation.h,
      layers: animation.layers.filter((layer) =>
        precompLayerFilter({ layer, step, stepIndex: index }),
      ),
    })

    const layer = {
      ddd: 0,
      ind: index + 1,
      ty: 0,
      nm: `Sequence step ${step.id}`,
      refId: precompId,
      sr: 1,
      ks: transform({
        position: [0, 0, 0],
        anchor: [0, 0, 0],
      }),
      ao: 0,
      w: animation.w,
      h: animation.h,
      ip: startFrame,
      op: startFrame + durationFrames,
      st: startFrame,
      bm: 0,
    }

    startFrame += durationFrames
    return layer
  })

  const totalFrames = startFrame
  const resolvedPersistentLayers =
    typeof persistentLayers === 'function'
      ? persistentLayers({ totalFrames, steps })
      : persistentLayers
  const imageAssetList = Array.from(imageAssets.values())
  const allLayers = [...layers, ...resolvedPersistentLayers].map(
    (layer, index) => ({ ...layer, ind: index + 1 }),
  )

  return {
    v: '5.12.2',
    fr: stage.frameRate,
    ip: 0,
    op: totalFrames,
    w: stage.width,
    h: stage.height,
    nm: name,
    ddd: 0,
    assets: [...imageAssetList, ...precompAssets],
    fonts: steps[0]?.animationData.fonts ?? { list: [] },
    layers: allLayers,
  }
}

export function displaySizeFromWidth(assetSize, width) {
  return [width, width * (assetSize[1] / assetSize[0])]
}

export function imageLayer({
  name,
  assetId,
  assetSize,
  displaySize,
  position,
  scale,
  opacity,
  rotation,
  durationFrames,
}) {
  const displayScale = [
    (displaySize[0] / assetSize[0]) * 100,
    (displaySize[1] / assetSize[1]) * 100,
  ]
  const resolvedScale = Array.isArray(scale?.[0]?.s)
    ? scale.map((keyframe) => ({
        ...keyframe,
        s: keyframe.s?.map(
          (value, index) => (value * displayScale[index]) / 100,
        ),
        e: keyframe.e?.map(
          (value, index) => (value * displayScale[index]) / 100,
        ),
      }))
    : scale
      ? scale.map((value, index) => (value * displayScale[index]) / 100)
      : displayScale

  return {
    ...baseLayer({
      name,
      type: 2,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({
        position,
        scale: resolvedScale,
        opacity,
        rotation,
        anchor: [assetSize[0] / 2, assetSize[1] / 2, 0],
      }),
    }),
    refId: assetId,
  }
}

export function circleLayer({
  name,
  radius,
  fill = '#ffffff',
  stroke = '#171a1f',
  strokeWidth = 3,
  strokeOpacity = 100,
  position,
  scale,
  opacity,
  durationFrames,
}) {
  const shapes = [
    {
      ty: 'el',
      d: 1,
      s: staticValue([radius * 2, radius * 2]),
      p: staticValue([0, 0]),
      nm: `${name} shape`,
    },
    {
      ty: 'fl',
      c: staticValue(
        Array.isArray(fill) ? fill : hexToRgbUnit(fill),
      ),
      o: staticValue(100),
      r: 1,
      nm: `${name} fill`,
    },
  ]

  if (stroke && strokeWidth > 0) {
    shapes.push({
      ty: 'st',
      c: staticValue(hexToRgbUnit(stroke).slice(0, 3)),
      o: staticValue(strokeOpacity),
      w: staticValue(strokeWidth),
      lc: 2,
      lj: 2,
      nm: `${name} stroke`,
    })
  }

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position, scale, opacity }),
    }),
    shapes,
  }
}

export function rectangleLayer({
  name,
  width,
  height,
  radius = 20,
  fill = '#ffffff',
  stroke = '#171a1f',
  strokeWidth = 3,
  strokeOpacity = 100,
  gradientStroke = null,
  position,
  scale,
  opacity,
  durationFrames,
}) {
  const fillColor = Array.isArray(fill)
    ? fill.slice(0, 3)
    : hexToRgbUnit(fill).slice(0, 3)
  const fillOpacity = Array.isArray(fill)
    ? (fill[3] ?? 1) * 100
    : 100
  const shapes = [
    {
      ty: 'rc',
      d: 1,
      s: staticValue([width, height]),
      p: staticValue([0, 0]),
      r: staticValue(radius),
      nm: `${name} shape`,
    },
    {
      ty: 'fl',
      c: staticValue(fillColor),
      o: staticValue(fillOpacity),
      r: 1,
      nm: `${name} fill`,
    },
  ]

  if (gradientStroke && strokeWidth > 0) {
    shapes.push({
      ty: 'gs',
      t: 1,
      s: staticValue(gradientStroke.start),
      e: staticValue(gradientStroke.end),
      o: staticValue(strokeOpacity),
      w: staticValue(strokeWidth),
      g: {
        p: gradientStroke.stops.length,
        k: staticValue(
          gradientStroke.stops.flatMap(({ offset, color }) => [
            offset,
            ...hexToRgbUnit(color).slice(0, 3),
          ]),
        ),
      },
      lc: 2,
      lj: 2,
      nm: `${name} gradient stroke`,
    })
  } else if (stroke && strokeWidth > 0) {
    shapes.push({
      ty: 'st',
      c: staticValue(hexToRgbUnit(stroke).slice(0, 3)),
      o: staticValue(strokeOpacity),
      w: staticValue(strokeWidth),
      lc: 2,
      lj: 2,
      nm: `${name} stroke`,
    })
  }

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position, scale, opacity }),
    }),
    shapes,
  }
}

const CIRCLE_BEZIER = 0.5522847498

export function topRoundedRectangleLayer({
  name,
  width,
  height,
  topLeftRadius = 0,
  topRightRadius = 0,
  fill = '#ffffff',
  position,
  scale,
  opacity,
  durationFrames,
}) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const leftRadius = Math.min(
    Math.max(topLeftRadius, 0),
    halfWidth,
    height,
  )
  const rightRadius = Math.min(
    Math.max(topRightRadius, 0),
    halfWidth,
    height,
  )
  const leftHandle = leftRadius * CIRCLE_BEZIER
  const rightHandle = rightRadius * CIRCLE_BEZIER
  const fillColor = Array.isArray(fill)
    ? fill.slice(0, 3)
    : hexToRgbUnit(fill).slice(0, 3)
  const fillOpacity = Array.isArray(fill)
    ? (fill[3] ?? 1) * 100
    : 100

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position, scale, opacity }),
    }),
    shapes: [
      {
        ty: 'sh',
        ks: staticValue({
          i: [
            [-leftHandle, 0],
            [0, 0],
            [0, -rightHandle],
            [0, 0],
            [0, 0],
            [0, 0],
          ],
          o: [
            [0, 0],
            [rightHandle, 0],
            [0, 0],
            [0, 0],
            [0, 0],
            [0, -leftHandle],
          ],
          v: [
            [-halfWidth + leftRadius, -halfHeight],
            [halfWidth - rightRadius, -halfHeight],
            [halfWidth, -halfHeight + rightRadius],
            [halfWidth, halfHeight],
            [-halfWidth, halfHeight],
            [-halfWidth, -halfHeight + leftRadius],
          ],
          c: true,
        }),
        nm: `${name} shape`,
      },
      {
        ty: 'fl',
        c: staticValue(fillColor),
        o: staticValue(fillOpacity),
        r: 1,
        nm: `${name} fill`,
      },
    ],
  }
}

export function textLayer({
  name,
  text,
  position,
  fontSize = 28,
  fontName = LOTTIE_FONT.name,
  color = '#171a1f',
  align = 'left',
  boxSize = [500, 80],
  boxPosition,
  lineHeight = fontSize * 1.2,
  scale,
  opacity,
  durationFrames,
}) {
  const centered = align === 'center'
  const rightAligned = align === 'right'
  const resolvedBoxPosition =
    boxPosition ??
    (centered
      ? [-boxSize[0] / 2, 0]
      : rightAligned
        ? [-boxSize[0], 0]
        : [0, 0])

  return {
    ...baseLayer({
      name,
      type: 5,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position, scale, opacity }),
    }),
    t: {
      d: {
        k: [
          {
            s: {
              sz: boxSize,
              ps: resolvedBoxPosition,
              s: fontSize,
              f: fontName,
              t: text,
              j: centered ? 2 : rightAligned ? 1 : 0,
              tr: 0,
              lh: lineHeight,
              ls: 0,
              fc: hexToRgbUnit(color).slice(0, 3),
            },
            t: 0,
          },
        ],
      },
      p: {},
      m: { g: 1, a: staticValue([0, 0]) },
      a: [],
    },
  }
}

export function edgeLayer({
  name,
  from,
  to,
  color,
  thickness = 3,
  strokeOpacity = 70,
  durationFrames,
  drawStartFrame = 0,
  drawEndFrame = durationFrames,
}) {
  const drawProgress =
    drawEndFrame <= drawStartFrame
      ? staticValue(100)
      : animatedValue(
          transitionKeyframes(0, 100, drawStartFrame, drawEndFrame),
        )

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position: [0, 0] }),
    }),
    shapes: [
      {
        ty: 'sh',
        ks: staticValue({
          i: [
            [0, 0],
            [0, 0],
          ],
          o: [
            [0, 0],
            [0, 0],
          ],
          v: [from, to],
          c: false,
        }),
        nm: `${name} path`,
      },
      {
        ty: 'st',
        c: staticValue(hexToRgbUnit(color).slice(0, 3)),
        o: staticValue(strokeOpacity),
        w: staticValue(thickness),
        lc: 2,
        lj: 2,
        nm: `${name} stroke`,
      },
      {
        ty: 'tm',
        s: staticValue(0),
        e: drawProgress,
        o: staticValue(0),
        m: 1,
        nm: `${name} draw`,
      },
    ],
  }
}

export function curvedPathLayer({
  name,
  from,
  to,
  fromHandleOffset,
  toHandleOffset,
  color,
  thickness = 3,
  strokeOpacity = 70,
  dash,
  gap,
  dashOffset,
  trimStart,
  trimEnd,
  durationFrames,
  drawStartFrame = 0,
  drawEndFrame = 0,
}) {
  const horizontalDistance = Math.abs(to[0] - from[0])
  const handle = Math.max(horizontalDistance * 0.45, 24)
  const resolvedFromHandleOffset = fromHandleOffset ?? [handle, 0]
  const resolvedToHandleOffset = toHandleOffset ?? [-handle, 0]
  const stroke = {
    ty: 'st',
    c: staticValue(hexToRgbUnit(color).slice(0, 3)),
    o: staticValue(strokeOpacity),
    w: staticValue(thickness),
    lc: 2,
    lj: 2,
    nm: `${name} stroke`,
  }

  if (dash && gap) {
    stroke.d = [
      { n: 'd', v: staticValue(dash) },
      { n: 'g', v: staticValue(gap) },
    ]

    if (dashOffset !== undefined) {
      stroke.d.push({
        n: 'o',
        v: Array.isArray(dashOffset?.[0]?.s)
          ? animatedValue(dashOffset)
          : staticValue(dashOffset),
      })
    }
  }

  const shapes = [
    {
      ty: 'sh',
      ks: staticValue({
        i: [
          [0, 0],
          resolvedToHandleOffset,
        ],
        o: [
          resolvedFromHandleOffset,
          [0, 0],
        ],
        v: [from, to],
        c: false,
      }),
      nm: `${name} path`,
    },
    stroke,
  ]

  if (trimStart || trimEnd) {
    shapes.push({
      ty: 'tm',
      s: trimStart
        ? animatedValue(trimStart)
        : staticValue(0),
      e: trimEnd
        ? animatedValue(trimEnd)
        : staticValue(100),
      o: staticValue(0),
      m: 1,
      nm: `${name} pulse`,
    })
  } else if (drawEndFrame > drawStartFrame) {
    shapes.push({
      ty: 'tm',
      s: staticValue(0),
      e: animatedValue(
        transitionKeyframes(0, 100, drawStartFrame, drawEndFrame),
      ),
      o: staticValue(0),
      m: 1,
      nm: `${name} draw`,
    })
  }

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({ position: [0, 0] }),
    }),
    shapes,
  }
}

export function ringLayer({
  name,
  radius,
  color,
  thickness = 4,
  strokeOpacity = 100,
  dash,
  gap,
  position,
  rotation = 0,
  scale,
  opacity,
  durationFrames,
}) {
  const stroke = {
    ty: 'st',
    c: staticValue(hexToRgbUnit(color).slice(0, 3)),
    o: staticValue(strokeOpacity),
    w: staticValue(thickness),
    lc: 2,
    lj: 2,
    nm: `${name} stroke`,
  }

  if (dash && gap) {
    stroke.d = [
      { n: 'd', v: staticValue(dash) },
      { n: 'g', v: staticValue(gap) },
    ]
  }

  return {
    ...baseLayer({
      name,
      type: 4,
      inFrame: 0,
      outFrame: durationFrames,
      transformData: transform({
        position,
        rotation,
        scale,
        opacity,
      }),
    }),
    shapes: [
      {
        ty: 'el',
        d: 1,
        s: staticValue([radius * 2, radius * 2]),
        p: staticValue([0, 0]),
        nm: `${name} shape`,
      },
      stroke,
    ],
  }
}
const DEFAULT_STAGE = { width: 1600, height: 900, frameRate: 30 }
