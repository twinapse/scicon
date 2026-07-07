import { useEffect, useState } from 'react'

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

function getInitialPreference() {
  return window.matchMedia?.(MEDIA_QUERY).matches ?? false
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(getInitialPreference)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(MEDIA_QUERY)

    if (!mediaQuery) {
      return undefined
    }

    const updatePreference = (event) => setReducedMotion(event.matches)
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return reducedMotion
}
