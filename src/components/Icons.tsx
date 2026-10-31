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

// Outline icons (Lucide-style paths, 24px grid, drawn with currentColor).
function Outline({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...base(props)}>
      {children}
    </svg>
  )
}

export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Outline>
  )
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
    </Outline>
  )
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </Outline>
  )
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </Outline>
  )
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Outline>
  )
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Outline>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Outline>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Outline>
  )
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </Outline>
  )
}

export function RepoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M9 7h6" />
    </Outline>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="m9 18 6-6-6-6" />
    </Outline>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Outline {...props}>
      <path d="m15 18-6-6 6-6" />
    </Outline>
  )
}
