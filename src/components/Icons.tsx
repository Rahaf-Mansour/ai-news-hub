// Small inline SVG icons, so the page needs no icon library.
import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({ width: 16, height: 16, 'aria-hidden': true as const, focusable: false as const, ...props })

export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base(props)}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  )
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base(props)}>
      <path d="M13.6 0H2.4A2.4 2.4 0 0 0 0 2.4v11.2A2.4 2.4 0 0 0 2.4 16h11.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 13.6 0ZM4.9 13.3H2.8V6.1h2.1v7.2ZM3.85 5.1a1.22 1.22 0 1 1 0-2.44 1.22 1.22 0 0 1 0 2.44Zm9.45 8.2h-2.1V9.8c0-.84-.02-1.92-1.17-1.92-1.17 0-1.35.91-1.35 1.86v3.56H6.6V6.1h2v.98h.03c.28-.53.97-1.09 2-1.09 2.13 0 2.53 1.4 2.53 3.23v4.08Z" />
    </svg>
  )
}

export function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...base(props)}>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  )
}
