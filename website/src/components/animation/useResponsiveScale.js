import { useLayoutEffect, useRef, useState } from 'react'

export function calculateResponsiveScale(availableWidth, referenceWidth) {
  return Math.min(1, availableWidth / referenceWidth)
}

export function useResponsiveScale(referenceWidth, enabled = true) {
  const viewportRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!enabled || !viewport) {
      return undefined
    }

    const updateScale = (availableWidth) => {
      if (availableWidth > 0) {
        setScale(calculateResponsiveScale(availableWidth, referenceWidth))
      }
    }

    updateScale(viewport.getBoundingClientRect().width)

    const resizeObserver = new ResizeObserver(([entry]) => {
      updateScale(entry.contentRect.width)
    })
    resizeObserver.observe(viewport)

    return () => resizeObserver.disconnect()
  }, [enabled, referenceWidth])

  return [viewportRef, scale]
}
