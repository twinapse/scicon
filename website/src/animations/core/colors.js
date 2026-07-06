export const COLORS = {
  background: '#061429',
  surface: '#061429',
  panel: '#0a1b36',
  ink: '#81c2cc',
  muted: '#5f8d99',
  border: '#244a65',
  edge: '#3f7892',
  white: '#ffffff',
  brightCyan: '#7df9ff',
}

export const CATEGORY_COLORS = {
  paper: '#4bb8ff',
  code: '#a681fe',
  data: '#43ffb5',
}

export function hexToRgba(hex, alpha = 1) {
  const value = hex.replace('#', '')

  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
    alpha,
  ]
}
