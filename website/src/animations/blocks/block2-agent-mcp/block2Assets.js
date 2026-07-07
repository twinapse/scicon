import { BLOCK2_CONFIG } from '../../config/block2Config.js'
import { resolveAssetUrl } from '../../core/assets.js'
import { createBlock2AssetCatalog } from './block2Runtime.js'

const catalog = createBlock2AssetCatalog(BLOCK2_CONFIG, resolveAssetUrl)

export const BLOCK2_ASSETS = catalog.lottieAssets
export const BLOCK2_ASSET_SIZE_BY_ID = catalog.assetSizeById
export const BLOCK2_LOTTIE_ID_BY_ASSET_ID = catalog.lottieIdByAssetId
