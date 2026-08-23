import { useCallback, useEffect, useState } from "react"
import { flushSync } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@fsx/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"

interface ModeSwitcherProps {
  duration?: number
}

export function ModeSwitcher({ duration = 400 }: ModeSwitcherProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget
      const next = !isDark

      await document.startViewTransition(() => {
        flushSync(() => {
          setIsDark(next)
          document.documentElement.classList.toggle("dark", next)
          localStorage.setItem("theme", next ? "dark" : "light")
        })
      }).ready

      const { top, left, width, height } = button.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top)
      )

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    },
    [isDark, duration]
  )

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label="Alternar tema"
            onClick={toggleTheme}
            size="icon"
            variant="ghost"
          />
        }
      >
        <HugeiconsIcon
          icon={isDark ? Sun01Icon : Moon01Icon}
          className="size-4"
        />
      </TooltipTrigger>
      <TooltipContent>Alternar tema</TooltipContent>
    </Tooltip>
  )
}
