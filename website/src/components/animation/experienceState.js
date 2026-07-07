import { EXPERIENCE_CONFIG } from './experienceConfig.js'

export const INITIAL_EXPERIENCE_STATE = Object.freeze({
  activeBlockId: 'block1',
  block1Complete: false,
  block2Complete: false,
})

export function markBlockComplete(state, blockId) {
  if (blockId === 'block1' && !state.block1Complete) {
    return { ...state, block1Complete: true }
  }
  if (blockId === 'block2' && !state.block2Complete) {
    return { ...state, block2Complete: true }
  }

  return state
}

export function getExperienceControls(state) {
  const controls = []

  if (state.activeBlockId === 'block2') {
    controls.push({
      ...EXPERIENCE_CONFIG.previousButton,
      action: 'block1',
    })
  }

  if (state.activeBlockId === 'block1' && state.block1Complete) {
    controls.push({
      ...EXPERIENCE_CONFIG.nextButton,
      action: 'block2',
    })
  }

  return controls
}

export function continueToBlock2(state) {
  if (!state.block1Complete || state.activeBlockId !== 'block1') {
    return state
  }

  return { ...state, activeBlockId: 'block2' }
}

export function returnToBlock1(state) {
  if (state.activeBlockId !== 'block2') {
    return state
  }

  return { ...state, activeBlockId: 'block1' }
}

export { EXPERIENCE_CONFIG } from './experienceConfig.js'
