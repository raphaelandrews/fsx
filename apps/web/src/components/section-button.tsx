import { buttonVariants } from "@fsx/ui/components/button"

interface SectionButtonProps {
  href: string
  target?: string
  label: string
}

export function SectionButton({ href, target, label }: SectionButtonProps) {
  return (
    <div className="flex justify-center items-center mt-8">
      <a
        href={href}
        target={target}
        className={buttonVariants({ variant: "default", size: "lg" })}
      >
        {label}
      </a>
    </div>
  )
}
