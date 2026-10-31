import { useEffect, useState, type RefObject } from 'react'

const SHOW_AFTER = 600

/** Floating button that appears after scrolling, returns to the top and puts focus in the search box. */
export function BackToTop({ focusTarget }: { focusTarget: RefObject<HTMLInputElement | null> }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTop = () => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    // Focus once the scroll has landed, without triggering another scroll.
    const started = performance.now()
    const settle = () => {
      if (window.scrollY <= 1 || performance.now() - started > 1500) focusTarget.current?.focus({ preventScroll: true })
      else requestAnimationFrame(settle)
    }
    requestAnimationFrame(settle)
  }

  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' back-to-top--visible' : ''}`}
      onClick={goTop}
      aria-label="Back to top"
      title="Back to top"
      hidden={!visible}
      data-cy="back-to-top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}
