const CONSOLAS_FONT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
}

export const LOTTIE_FONTS = Object.entries(CONSOLAS_FONT_NAMES).map(
  ([weight, name]) => ({
    name: `Consolas-${name}`,
    family: 'Consolas',
    style: 'Regular',
    weight: Number(weight),
    ascent: 75,
  }),
)

export const LOTTIE_FONT = LOTTIE_FONTS.find(
  (font) => font.weight === 400,
)

export const LOTTIE_MONO_FONT = LOTTIE_FONT

export function getLottieFontByWeight(weight) {
  const font = LOTTIE_FONTS.find(
    (candidate) => candidate.weight === weight,
  )

  if (!font) {
    throw new Error(`Unsupported Consolas font weight: ${weight}`)
  }

  return font
}
