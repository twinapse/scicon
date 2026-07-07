import Lottie from 'react-lottie-player/dist/LottiePlayerLight.modern'

function LottieStage({ animationData, play }) {
  return (
    <div className="animation-stage__canvas" aria-hidden="true">
      <Lottie
        animationData={animationData}
        play={play}
        loop={false}
        renderer="svg"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default LottieStage
