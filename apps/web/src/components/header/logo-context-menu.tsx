
import { ReactNode, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Download01Icon,
  MoonIcon,
  Sun01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
import { renderToStaticMarkup } from "react-dom/server"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@fsx/ui/components/context-menu"
import { Logo } from "../logo"
import { toast } from "sonner"

interface LogoContextMenuProps {
  children: ReactNode
}

export function LogoContextMenu({ children }: LogoContextMenuProps) {
  const getLogoSvgString = useCallback((color: string) => {
    const svgString = renderToStaticMarkup(<Logo style={{ color }} />)
    if (!svgString.includes("xmlns")) {
      return svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    return svgString
  }, [])

  const handleCopySvg = useCallback(() => {
    const svgString = getLogoSvgString("currentColor")
    navigator.clipboard.writeText(svgString)
    toast.success("Logo SVG copied to clipboard")
  }, [getLogoSvgString])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadSvg = useCallback((theme: "light" | "dark") => {
    const color = theme === "light" ? "#000000" : "#ffffff"
    const svgString = getLogoSvgString(color)
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    downloadBlob(blob, `logo-${theme}.svg`)
    toast.success(`Downloaded ${theme} theme SVG`)
  }, [getLogoSvgString])

  const handleDownloadPng = useCallback((theme: "light" | "dark") => {
    const color = theme === "light" ? "#000000" : "#ffffff"
    const svgString = getLogoSvgString(color)

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    const svgBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)))

    img.onload = () => {
      const scale = 4
      canvas.width = 52 * scale
      canvas.height = 20 * scale

      if (ctx) {
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            downloadBlob(blob, `logo-${theme}.png`)
            toast.success(`Downloaded ${theme} theme PNG`)
          }
        }, "image/png")
      }
    }

    img.src = svgBase64
  }, [getLogoSvgString])

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleCopySvg}>
          <HugeiconsIcon className="mr-2 h-4 w-4" icon={Copy01Icon} />
          Copy SVG
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <HugeiconsIcon className="mr-2 h-4 w-4" icon={Download01Icon} />
            Download SVG
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleDownloadSvg("light")}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Sun01Icon} />
              Light Theme
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDownloadSvg("dark")}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={MoonIcon} />
              Dark Theme
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <HugeiconsIcon className="mr-2 h-4 w-4" icon={Image01Icon} />
            Download PNG
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleDownloadPng("light")}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Sun01Icon} />
              Light Theme
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDownloadPng("dark")}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={MoonIcon} />
              Dark Theme
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
