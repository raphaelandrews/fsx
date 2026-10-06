import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";

export interface SeasonCard {
  playerId: number;
  name: string;
  year: number;
  tournaments: number;
  bestGain: number | null;
  xpGained: number;
  level: number;
  podiums: number;
  ratingChange: { label: string; value: number | null }[];
}

const WIDTH = 1080;
const HEIGHT = 1350;
const PAD = 96;
// Canvas can't read CSS tokens reliably across browsers, so the brand colors are
// spelled out here (primary burple and its inverse from globals.css).
const BURPLE = "#3e66f6";
const DEEP = "#1d2a7a";
const WHITE = "#ffffff";
const SOFT = "rgba(255, 255, 255, 0.72)";
const FONT = "Fustat, system-ui, sans-serif";

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number) {
  let current = size;
  ctx.font = `${weight} ${current}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && current > 40) {
    current -= 4;
    ctx.font = `${weight} ${current}px ${FONT}`;
  }
  return current;
}

function draw(card: SeasonCard): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BURPLE;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = DEEP;
  ctx.beginPath();
  ctx.arc(WIDTH + 60, -60, 340, 0, Math.PI * 2);
  ctx.fill();

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SOFT;
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText(`FSX · Temporada ${card.year}`, PAD, PAD + 40);

  ctx.fillStyle = WHITE;
  const nameSize = fitText(ctx, card.name, 700, 112, WIDTH - PAD * 2);
  ctx.fillText(card.name, PAD, 340);

  const tiles: [string, string][] = [
    ["Torneios", String(card.tournaments)],
    ["Melhor desempenho", card.bestGain === null ? "—" : `+${card.bestGain}`],
    ["XP no ano", `+${card.xpGained}`],
    ["Pódios", String(card.podiums)],
  ];
  const tileWidth = (WIDTH - PAD * 2 - 32) / 2;
  const tileHeight = 210;
  tiles.forEach(([label, value], index) => {
    const x = PAD + (index % 2) * (tileWidth + 32);
    const y = 340 + nameSize * 0.6 + 60 + Math.floor(index / 2) * (tileHeight + 32);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(x, y, tileWidth, tileHeight, 40);
    ctx.fill();
    ctx.fillStyle = SOFT;
    ctx.font = `600 36px ${FONT}`;
    ctx.fillText(label, x + 40, y + 72);
    ctx.fillStyle = WHITE;
    ctx.font = `700 88px ${FONT}`;
    ctx.fillText(value, x + 40, y + 170);
  });

  const changes = card.ratingChange.filter((change) => change.value !== null);
  ctx.font = `600 40px ${FONT}`;
  changes.forEach((change, index) => {
    const y = HEIGHT - PAD - 140 - (changes.length - 1 - index) * 64;
    ctx.fillStyle = SOFT;
    ctx.fillText(change.label, PAD, y);
    ctx.fillStyle = WHITE;
    const text = signed(change.value!);
    ctx.fillText(text, WIDTH - PAD - ctx.measureText(text).width, y);
  });

  ctx.fillStyle = SOFT;
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(`Nível ${card.level} · fsx.org.br/jogadores/${card.playerId}`, PAD, HEIGHT - PAD);
  return canvas;
}

export function SeasonShareButton({ card }: { card: SeasonCard }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await document.fonts.load(`700 112px Fustat`);
      const blob = await new Promise<Blob | null>((resolve) => draw(card).toBlob(resolve, "image/png"));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fsx-temporada-${card.year}-${card.playerId}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="lg" onClick={download} disabled={busy}>
      <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" className="size-4" aria-hidden />
      {busy ? "Gerando…" : "Baixar imagem"}
    </Button>
  );
}
