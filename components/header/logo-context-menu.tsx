"use client"

import { ReactNode, useCallback } from "react"
import { CopyIcon, DownloadIcon, MoonIcon, SunIcon, FileImage } from "lucide-react"
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
} from "@/components/ui/context-menu"
import { Logo } from "@/components/logo"
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
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleCopySvg}>
          <CopyIcon className="mr-2 h-4 w-4" />
          Copy SVG
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download SVG
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleDownloadSvg("light")}>
              <SunIcon className="mr-2 h-4 w-4" />
              Light Theme
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDownloadSvg("dark")}>
              <MoonIcon className="mr-2 h-4 w-4" />
              Dark Theme
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FileImage className="mr-2 h-4 w-4" />
            Download PNG
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleDownloadPng("light")}>
              <SunIcon className="mr-2 h-4 w-4" />
              Light Theme
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDownloadPng("dark")}>
              <MoonIcon className="mr-2 h-4 w-4" />
              Dark Theme
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
