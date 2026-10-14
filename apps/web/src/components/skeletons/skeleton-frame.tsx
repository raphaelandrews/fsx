import type { ReactNode } from "react"

interface SkeletonFrameProps {
  children: ReactNode
  label?: string
  className?: string
  contentClassName?: string
}

/** Announces a loading state once and hides the placeholder shapes from screen readers. */
export function SkeletonFrame({ children, label = "Carregando…", className, contentClassName }: SkeletonFrameProps) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden className={contentClassName}>
        {children}
      </div>
    </div>
  )
}
