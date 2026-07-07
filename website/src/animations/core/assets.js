const LOCAL_BASE = '/scicon/img/animation/'
const REMOTE_BASE =
  'https://raw.githubusercontent.com/twinapse/scicon-assets/main/images/'

const REMOTE_PATHS = new Map([
  ['characters/researcher.png', 'researcher.png'],
  ['characters/agent.png', 'agent.png'],
  ['characters/user.png', 'user.png'],
  ['icons/code.svg', 'code.svg'],
])

export function resolveAssetUrl(path) {
  return REMOTE_PATHS.has(path)
    ? REMOTE_BASE + REMOTE_PATHS.get(path)
    : LOCAL_BASE + path
}
