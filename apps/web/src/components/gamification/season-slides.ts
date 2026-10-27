export interface SeasonCard {
  playerId: number;
  name: string;
  year: number;
  tournaments: number;
  busiestMonth: { label: string; count: number } | null;
  bestGain: { value: number; tournament: string | null } | null;
  xpGained: number;
  level: number;
  podiums: { place: 1 | 2 | 3; name: string; category: string | null }[];
  achievements: { label: string; tier: "bronze" | "silver" | "gold" | "platinum" }[];
  ratingChange: { label: string; value: number | null }[];
}

export interface SeasonSlide {
  id: string;
  alt: string;
  draw: (ctx: CanvasRenderingContext2D, card: SeasonCard) => void;
}

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1920;

const PAD = 88;
const FONT = "Fustat, system-ui, sans-serif";

// Canvas cannot read CSS tokens, so each slide spells out its palette; the first is the brand burple and its deep tone from globals.css.
interface Palette {
  bg: string;
  shape: string;
  ink: string;
  soft: string;
  accent: string;
}

const PALETTES = {
  brand: { bg: "#3e66f6", shape: "#1d2a7a", ink: "#ffffff", soft: "rgba(255,255,255,0.74)", accent: "#c8ff5a" },
  pink: { bg: "#ff5a8a", shape: "#c21e57", ink: "#2a0a1c", soft: "rgba(42,10,28,0.72)", accent: "#ffffff" },
  night: { bg: "#141b4d", shape: "#2a38a8", ink: "#ffffff", soft: "rgba(255,255,255,0.72)", accent: "#c8ff5a" },
  lime: { bg: "#c8ff5a", shape: "#9fe02f", ink: "#14206b", soft: "rgba(20,32,107,0.72)", accent: "#3e66f6" },
  gold: { bg: "#ffb703", shape: "#ff8c00", ink: "#2f1700", soft: "rgba(47,23,0,0.72)", accent: "#ffffff" },
  violet: { bg: "#7b2ff7", shape: "#4b12b3", ink: "#ffffff", soft: "rgba(255,255,255,0.76)", accent: "#ffd166" },
} satisfies Record<string, Palette>;

const MEDALS = { 1: { label: "Ouro", color: "#ffd24a" }, 2: { label: "Prata", color: "#dfe5ee" }, 3: { label: "Bronze", color: "#e0955a" } } as const;
const TIER_RANK = { platinum: 3, gold: 2, silver: 1, bronze: 0 } as const;

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, min = 48) {
  let current = size;
  ctx.font = font(weight, current);
  while (ctx.measureText(text).width > maxWidth && current > min) {
    current -= 4;
    ctx.font = font(weight, current);
  }
  return current;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s.,;:-]+$/, "")}…`;
    return kept;
  }
  return lines;
}

function background(ctx: CanvasRenderingContext2D, palette: Palette, variant: number) {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  ctx.fillStyle = palette.shape;
  ctx.globalAlpha = 0.9;
  const arcs: [number, number, number][][] = [
    [[SLIDE_WIDTH + 80, -40, 520], [-120, SLIDE_HEIGHT - 260, 420]],
    [[-100, 220, 380], [SLIDE_WIDTH + 140, SLIDE_HEIGHT - 120, 560]],
    [[SLIDE_WIDTH / 2, SLIDE_HEIGHT + 120, 700], [SLIDE_WIDTH + 60, 300, 260]],
  ];
  for (const [x, y, radius] of arcs[variant % arcs.length]!) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = palette.soft;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 6;
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath();
    ctx.arc(SLIDE_WIDTH - 140, SLIDE_HEIGHT - 360, 110 * ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function chrome(ctx: CanvasRenderingContext2D, card: SeasonCard, palette: Palette, index: number, total: number) {
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.soft;
  ctx.font = font(700, 38);
  ctx.fillText(`FSX · ${card.year}`, PAD, PAD + 36);

  const gap = 14;
  const width = (SLIDE_WIDTH - PAD * 2 - gap * (total - 1)) / total;
  for (let step = 0; step < total; step++) {
    ctx.globalAlpha = step === index ? 1 : 0.28;
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.roundRect(PAD + step * (width + gap), PAD + 72, width, 8, 4);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = palette.soft;
  ctx.font = font(600, 34);
  ctx.fillText(`fsx.org.br/jogadores/${card.playerId}`, PAD, SLIDE_HEIGHT - PAD);
}

function eyebrow(ctx: CanvasRenderingContext2D, palette: Palette, text: string, y: number) {
  ctx.fillStyle = palette.soft;
  ctx.font = font(700, 48);
  ctx.fillText(text, PAD, y);
}

function bigNumber(ctx: CanvasRenderingContext2D, palette: Palette, text: string, y: number, size = 420) {
  ctx.fillStyle = palette.accent;
  const fitted = fit(ctx, text, 800, size, SLIDE_WIDTH - PAD * 2, 160);
  ctx.fillText(text, PAD - 8, y);
  return fitted;
}

function body(ctx: CanvasRenderingContext2D, palette: Palette, text: string, y: number, size = 64, maxLines = 3) {
  ctx.fillStyle = palette.ink;
  ctx.font = font(700, size);
  const lines = wrap(ctx, text, SLIDE_WIDTH - PAD * 2, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, PAD, y + index * size * 1.2));
  return y + lines.length * size * 1.2;
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export function buildSlides(card: SeasonCard): { palette: Palette; slide: SeasonSlide }[] {
  const slides: { palette: Palette; draw: SeasonSlide["draw"]; id: string; alt: string }[] = [];

  slides.push({
    id: "intro",
    palette: PALETTES.brand,
    alt: `Retrospectiva ${card.year} de ${card.name}`,
    draw: (ctx) => {
      eyebrow(ctx, PALETTES.brand, "Sua retrospectiva", 700);
      ctx.fillStyle = PALETTES.brand.accent;
      fit(ctx, String(card.year), 800, 520, SLIDE_WIDTH - PAD * 2);
      ctx.fillText(String(card.year), PAD - 12, 1080);
      ctx.fillStyle = PALETTES.brand.ink;
      const size = fit(ctx, card.name, 700, 96, SLIDE_WIDTH - PAD * 2, 56);
      ctx.fillText(card.name, PAD, 1240 + size * 0.2);
      ctx.fillStyle = PALETTES.brand.soft;
      ctx.font = font(600, 44);
      ctx.fillText("no xadrez sergipano", PAD, 1330);
    },
  });

  if (card.tournaments > 0) {
    slides.push({
      id: "tournaments",
      palette: PALETTES.pink,
      alt: `${card.tournaments} torneios disputados em ${card.year}`,
      draw: (ctx) => {
        const palette = PALETTES.pink;
        eyebrow(ctx, palette, "Você entrou em campo", 620);
        bigNumber(ctx, palette, String(card.tournaments), 1000);
        const end = body(ctx, palette, plural(card.tournaments, "torneio disputado", "torneios disputados"), 1120, 76, 2);
        if (card.busiestMonth) {
          ctx.fillStyle = palette.soft;
          ctx.font = font(600, 48);
          const text = `${card.busiestMonth.label} foi o seu mês mais movimentado: ${card.busiestMonth.count} ${plural(card.busiestMonth.count, "dia", "dias")} de torneio.`;
          wrap(ctx, text, SLIDE_WIDTH - PAD * 2, 3).forEach((line, index) => ctx.fillText(line, PAD, end + 80 + index * 62));
        }
      },
    });
  }

  const changes = card.ratingChange.filter((change): change is { label: string; value: number } => change.value !== null);
  if (changes.length > 0) {
    slides.push({
      id: "rating",
      palette: PALETTES.night,
      alt: `Variação de rating em ${card.year}: ${changes.map((change) => `${change.label} ${signed(change.value)}`).join(", ")}`,
      draw: (ctx) => {
        const palette = PALETTES.night;
        eyebrow(ctx, palette, "Seu rating mexeu assim", 520);
        const largest = Math.max(...changes.map((change) => Math.abs(change.value)), 1);
        const rowHeight = 300;
        const top = 680;
        const trackWidth = SLIDE_WIDTH - PAD * 2;
        changes.forEach((change, index) => {
          const y = top + index * rowHeight;
          ctx.fillStyle = palette.soft;
          ctx.font = font(700, 48);
          ctx.fillText(change.label, PAD, y);
          const color = change.value >= 0 ? palette.accent : "#ff7a9c";
          ctx.fillStyle = color;
          ctx.font = font(800, 120);
          const text = signed(change.value);
          ctx.fillText(text, PAD, y + 124);
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.roundRect(PAD, y + 160, trackWidth, 24, 12);
          ctx.fill();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(PAD, y + 160, Math.max(24, (Math.abs(change.value) / largest) * trackWidth), 24, 12);
          ctx.fill();
        });
      },
    });
  }

  if (card.bestGain) {
    const gain = card.bestGain;
    slides.push({
      id: "best",
      palette: PALETTES.lime,
      alt: `Melhor desempenho de ${card.year}: ${signed(gain.value)} pontos${gain.tournament ? ` em ${gain.tournament}` : ""}`,
      draw: (ctx) => {
        const palette = PALETTES.lime;
        eyebrow(ctx, palette, "Seu melhor momento", 620);
        ctx.fillStyle = palette.accent;
        fit(ctx, signed(gain.value), 800, 400, SLIDE_WIDTH - PAD * 2, 160);
        ctx.fillText(signed(gain.value), PAD - 8, 980);
        const end = body(ctx, palette, "pontos de rating em um único torneio", 1100, 64, 2);
        if (gain.tournament) {
          ctx.fillStyle = palette.ink;
          ctx.font = font(800, 56);
          wrap(ctx, gain.tournament, SLIDE_WIDTH - PAD * 2, 3).forEach((line, index) => ctx.fillText(line, PAD, end + 90 + index * 70));
        }
      },
    });
  }

  if (card.podiums.length > 0) {
    const shown = card.podiums.slice(0, 5);
    slides.push({
      id: "podiums",
      palette: PALETTES.gold,
      alt: `${card.podiums.length} ${plural(card.podiums.length, "pódio", "pódios")} em ${card.year}`,
      draw: (ctx) => {
        const palette = PALETTES.gold;
        eyebrow(ctx, palette, "Subiu ao pódio", 520);
        ctx.fillStyle = palette.accent;
        ctx.font = font(800, 300);
        ctx.fillText(String(card.podiums.length), PAD - 8, 800);
        ctx.fillStyle = palette.ink;
        ctx.font = font(700, 64);
        ctx.fillText(plural(card.podiums.length, "vez", "vezes"), PAD + ctx.measureText(String(card.podiums.length)).width + 20, 800);
        const rowHeight = 150;
        shown.forEach((podium, index) => {
          const y = 900 + index * rowHeight;
          const medal = MEDALS[podium.place];
          ctx.fillStyle = medal.color;
          ctx.beginPath();
          ctx.arc(PAD + 44, y + 40, 44, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2f1700";
          ctx.font = font(800, 48);
          ctx.textAlign = "center";
          ctx.fillText(`${podium.place}º`, PAD + 44, y + 58);
          ctx.textAlign = "left";
          ctx.fillStyle = palette.ink;
          const text = podium.category ? `${podium.name} · ${podium.category}` : podium.name;
          fit(ctx, text, 700, 44, SLIDE_WIDTH - PAD * 2 - 130, 30);
          ctx.fillText(text, PAD + 120, y + 56);
        });
        if (card.podiums.length > shown.length) {
          ctx.fillStyle = palette.soft;
          ctx.font = font(600, 40);
          ctx.fillText(`e mais ${card.podiums.length - shown.length}`, PAD + 120, 900 + shown.length * rowHeight + 30);
        }
      },
    });
  }

  if (card.achievements.length > 0) {
    const ranked = [...card.achievements].sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);
    const shown = ranked.slice(0, 5);
    slides.push({
      id: "achievements",
      palette: PALETTES.violet,
      alt: `${card.achievements.length} ${plural(card.achievements.length, "conquista", "conquistas")} em ${card.year}`,
      draw: (ctx) => {
        const palette = PALETTES.violet;
        eyebrow(ctx, palette, "Você desbloqueou", 520);
        ctx.fillStyle = palette.accent;
        ctx.font = font(800, 300);
        ctx.fillText(String(card.achievements.length), PAD - 8, 800);
        ctx.fillStyle = palette.ink;
        ctx.font = font(700, 64);
        ctx.fillText(plural(card.achievements.length, "conquista", "conquistas"), PAD + ctx.measureText(String(card.achievements.length)).width + 20, 800);
        shown.forEach((achievement, index) => {
          const y = 920 + index * 130;
          ctx.fillStyle = "rgba(255,255,255,0.14)";
          ctx.beginPath();
          ctx.roundRect(PAD, y, SLIDE_WIDTH - PAD * 2, 100, 50);
          ctx.fill();
          ctx.fillStyle = palette.accent;
          ctx.beginPath();
          ctx.arc(PAD + 50, y + 50, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = palette.ink;
          fit(ctx, achievement.label, 700, 46, SLIDE_WIDTH - PAD * 2 - 130, 30);
          ctx.fillText(achievement.label, PAD + 96, y + 66);
        });
        if (ranked.length > shown.length) {
          ctx.fillStyle = palette.soft;
          ctx.font = font(600, 40);
          ctx.fillText(`e mais ${ranked.length - shown.length}`, PAD + 96, 920 + shown.length * 130 + 40);
        }
      },
    });
  }

  slides.push({
    id: "summary",
    palette: PALETTES.brand,
    alt: `Resumo de ${card.year} de ${card.name}`,
    draw: (ctx) => {
      const palette = PALETTES.brand;
      ctx.fillStyle = palette.ink;
      const size = fit(ctx, card.name, 800, 100, SLIDE_WIDTH - PAD * 2, 56);
      ctx.fillText(card.name, PAD, 520 + size * 0.2);
      ctx.fillStyle = palette.soft;
      ctx.font = font(600, 48);
      ctx.fillText(`Temporada ${card.year}`, PAD, 600);

      const tiles: [string, string][] = [
        ["Torneios", String(card.tournaments)],
        ["Pódios", String(card.podiums.length)],
        ["XP no ano", `+${card.xpGained}`],
        ["Nível", String(card.level)],
      ];
      const tileWidth = (SLIDE_WIDTH - PAD * 2 - 32) / 2;
      const tileHeight = 270;
      tiles.forEach(([label, value], index) => {
        const x = PAD + (index % 2) * (tileWidth + 32);
        const y = 690 + Math.floor(index / 2) * (tileHeight + 32);
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.beginPath();
        ctx.roundRect(x, y, tileWidth, tileHeight, 48);
        ctx.fill();
        ctx.fillStyle = palette.soft;
        ctx.font = font(600, 40);
        ctx.fillText(label, x + 44, y + 84);
        ctx.fillStyle = index % 3 === 0 ? palette.accent : palette.ink;
        ctx.font = font(800, 120);
        ctx.fillText(value, x + 44, y + 218);
      });

      if (changes.length > 0) {
        ctx.font = font(700, 48);
        changes.forEach((change, index) => {
          const y = 1400 + index * 76;
          ctx.fillStyle = palette.soft;
          ctx.fillText(change.label, PAD, y);
          ctx.fillStyle = change.value >= 0 ? palette.accent : "#ffb3c6";
          const text = signed(change.value);
          ctx.fillText(text, SLIDE_WIDTH - PAD - ctx.measureText(text).width, y);
        });
      }
    },
  });

  return slides.map(({ palette, ...slide }) => ({ palette, slide }));
}

export async function renderSlides(card: SeasonCard): Promise<{ id: string; alt: string; blob: Blob }[]> {
  await Promise.all([document.fonts.load(font(800, 120)), document.fonts.load(font(600, 40))]);
  const built = buildSlides(card);
  const canvas = document.createElement("canvas");
  canvas.width = SLIDE_WIDTH;
  canvas.height = SLIDE_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const rendered: { id: string; alt: string; blob: Blob }[] = [];
  for (const [index, { palette, slide }] of built.entries()) {
    ctx.clearRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    ctx.textAlign = "left";
    background(ctx, palette, index);
    chrome(ctx, card, palette, index, built.length);
    slide.draw(ctx, card);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) rendered.push({ id: slide.id, alt: slide.alt, blob });
  }
  return rendered;
}
