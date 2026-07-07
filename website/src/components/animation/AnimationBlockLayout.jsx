function AnimationBlockLayout({
  children,
  storyline,
  storylineReferenceWidth,
  canvasReferenceWidth,
  ariaLabel = 'Scientific output conversion animation',
}) {
  const layoutReferenceWidth = Math.max(
    storylineReferenceWidth,
    canvasReferenceWidth,
  )

  return (
    <section
      className="animation-block"
      aria-label={ariaLabel}
      style={{ maxWidth: `${layoutReferenceWidth}px` }}
    >
      {storyline}
      <div
        className="animation-block__stage"
        style={{ maxWidth: `${canvasReferenceWidth}px` }}
      >
        {children}
      </div>
    </section>
  )
}

export default AnimationBlockLayout
