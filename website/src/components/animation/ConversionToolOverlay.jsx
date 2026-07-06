import { BLOCK1_CONFIG } from '../../animations/config/block1Config.js'
import { getStepConfig } from '../../animations/config/animationBlockSchema.js'
import { CONVERSION_TOOL_ASSET_URLS } from '../../animations/blocks/block1-scientific-output/block1Assets.js'
import { BLOCK1_RUNTIME } from '../../animations/blocks/block1-scientific-output/block1Runtime.js'

const { layout: BLOCK1_LAYOUT, stage: STAGE } = BLOCK1_RUNTIME

function stageRectStyle({ center, width, height }) {
  return {
    left: `${((center[0] - width / 2) / STAGE.width) * 100}%`,
    top: `${((center[1] - height / 2) / STAGE.height) * 100}%`,
    width: `${(width / STAGE.width) * 100}%`,
    height: `${(height / STAGE.height) * 100}%`,
  }
}

const CONVERSION_TOOL_SCHEDULE = BLOCK1_RUNTIME.conversionToolSchedule
const IDLE_STEP = getStepConfig(BLOCK1_CONFIG, 'scientific-output-idle')

function ConversionToolOverlay({ visible, intro, spinning }) {
  if (!visible) {
    return null
  }

  const tool = BLOCK1_CONFIG.phases.conversionTool
  const containerAsset =
    BLOCK1_CONFIG.assets.conversionToolContainer
  const containerAssetScale =
    1 / containerAsset.visibleWidthRatio
  const containerStyle = stageRectStyle({
    center: BLOCK1_LAYOUT.conversionTool.center,
    width: BLOCK1_LAYOUT.conversionTool.width * containerAssetScale,
    height: tool.panel.height * containerAssetScale,
  })
  const engineStyle = stageRectStyle({
    center: BLOCK1_LAYOUT.conversionTool.engine,
    width: tool.engine.size,
    height: tool.engine.size,
  })

  return (
    <div
      className={
        intro
          ? 'conversion-tool-overlay conversion-tool-overlay--intro'
          : 'conversion-tool-overlay'
      }
      style={{
        '--conversion-tool-intro-delay':
          `${CONVERSION_TOOL_SCHEDULE.shell.revealStartMs}ms`,
        '--conversion-tool-intro-duration':
          `${IDLE_STEP.cues.conversionToolShell.revealDurationMs}ms`,
        '--conversion-tool-processing-duration':
          `${CONVERSION_TOOL_SCHEDULE.processingDurationMs}ms`,
      }}
      aria-hidden="true"
    >
      <img
        className="conversion-tool-overlay__container"
        src={CONVERSION_TOOL_ASSET_URLS.container}
        alt=""
        style={containerStyle}
      />
      <img
        className={
          spinning
            ? 'conversion-tool-overlay__engine conversion-tool-overlay__engine--spinning'
            : 'conversion-tool-overlay__engine'
        }
        src={CONVERSION_TOOL_ASSET_URLS.engine}
        alt=""
        style={engineStyle}
      />
    </div>
  )
}

export default ConversionToolOverlay
