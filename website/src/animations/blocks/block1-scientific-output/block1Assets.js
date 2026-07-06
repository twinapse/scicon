import { BLOCK1_CONFIG } from '../../config/block1Config.js'
import { resolveAssetUrl } from '../../core/assets.js'
import { createBlock1AssetCatalog } from './block1Runtime.js'

const catalog = createBlock1AssetCatalog(BLOCK1_CONFIG, resolveAssetUrl)

export const BLOCK1_ASSETS = catalog.lottieAssets
export const ASSET_SIZE_BY_ID = catalog.assetSizeById
export const OUTPUT_ASSET_BY_CATEGORY = catalog.outputAssetByCategory
export const GRAPH_ICON_ASSET_BY_NAME = catalog.graphIconAssetByName
export const CONVERSION_TOOL_ASSET_URLS = catalog.conversionToolAssetUrls
