import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Download01Icon, Share08Icon, SparklesIcon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@fsx/ui/components/dialog";

import { renderSlides, type SeasonCard } from "./season-slides";

export type { SeasonCard } from "./season-slides";

interface Rendered {
  id: string;
  alt: string;
  blob: Blob;
  url: string;
}

const fileName = (card: SeasonCard, id: string) => `fsx-retrospectiva-${card.year}-${card.playerId}-${id}.png`;

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function SeasonShareButton({ card }: { card: SeasonCard }) {
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<Rendered[]>([]);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let urls: string[] = [];
    setFailed(false);
    renderSlides(card)
      .then((rendered) => {
        if (cancelled) return;
        const withUrls = rendered.map((slide) => ({ ...slide, url: URL.createObjectURL(slide.blob) }));
        urls = withUrls.map((slide) => slide.url);
        setSlides(withUrls);
        setIndex(0);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
      setSlides([]);
    };
  }, [open, card]);

  const goTo = useCallback((target: number) => {
    const element = track.current;
    if (!element || slides.length === 0) return;
    const next = Math.min(slides.length - 1, Math.max(0, target));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: next * element.clientWidth, behavior: reduced ? "auto" : "smooth" });
  }, [slides.length]);

  const current = slides[index];

  const share = async () => {
    const files = slides.map((slide) => new File([slide.blob], fileName(card, slide.id), { type: "image/png" }));
    if (!navigator.canShare({ files })) return;
    try {
      await navigator.share({ files, title: `Retrospectiva ${card.year}` });
    } catch {
      return;
    }
  };

  const ready = slides.length > 0;

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={SparklesIcon} data-icon="inline-start" className="size-4" aria-hidden />
        Gerar retrospectiva
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Retrospectiva {card.year}</DialogTitle>
            <DialogDescription>
              {ready ? `${slides.length} imagens para os stories. Deslize para ver todas.` : "Montando as imagens…"}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mx-auto w-fit">
            <div
              ref={track}
              role="group"
              aria-roledescription="carrossel"
              aria-label={`Retrospectiva ${card.year}`}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") goTo(index + 1);
                if (event.key === "ArrowLeft") goTo(index - 1);
              }}
              onScroll={(event) => {
                const element = event.currentTarget;
                setIndex(Math.round(element.scrollLeft / element.clientWidth));
              }}
              className="no-scrollbar flex h-[min(48vh,520px)] aspect-[9/16] snap-x snap-mandatory overflow-x-auto rounded-2xl bg-muted outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              {ready
                ? slides.map((slide, position) => (
                    <img
                      key={slide.id}
                      src={slide.url}
                      alt={slide.alt}
                      aria-hidden={position !== index}
                      className="size-full shrink-0 snap-center object-cover"
                      draggable={false}
                    />
                  ))
                : <div className="size-full shrink-0 animate-pulse" aria-hidden />}
            </div>
            {failed ? <p role="alert" className="mt-2 text-center text-destructive text-sm">Não foi possível gerar as imagens.</p> : null}
            {ready ? (
              <>
                <Button
                  variant="secondary"
                  size="icon-lg"
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full"
                  aria-label="Imagem anterior"
                  disabled={index === 0}
                  onClick={() => goTo(index - 1)}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-lg"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
                  aria-label="Próxima imagem"
                  disabled={index === slides.length - 1}
                  onClick={() => goTo(index + 1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" aria-hidden />
                </Button>
              </>
            ) : null}
          </div>

          <div role="status" className="text-center text-muted-foreground text-sm tabular-nums">
            {ready ? `${index + 1} de ${slides.length}` : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="xl" disabled={!current} onClick={() => current && save(current.blob, fileName(card, current.id))}>
              <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" className="size-4" aria-hidden />
              Baixar esta
            </Button>
            <Button
              size="xl"
              variant="outline"
              disabled={!ready}
              onClick={() => slides.forEach((slide) => save(slide.blob, fileName(card, slide.id)))}
            >
              Baixar todas
            </Button>
            {canShare ? (
              <Button size="xl" variant="outline" className="sm:col-span-2" disabled={!ready} onClick={share}>
                <HugeiconsIcon icon={Share08Icon} data-icon="inline-start" className="size-4" aria-hidden />
                Compartilhar
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
