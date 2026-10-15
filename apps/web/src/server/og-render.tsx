import { ImageResponse } from "@cf-wasm/og/workerd";

import type { PlayerCard, PostCard } from "@/lib/og";

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND = "Federação Sergipana de Xadrez";

const frame = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  height: "100%",
  padding: 64,
  color: "#ffffff",
  backgroundImage: "linear-gradient(135deg, #1e3a8a 0%, #4873ff 100%)",
} as const;

const brand = <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>{BRAND}</div>;

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 28px", borderRadius: 24, background: "rgba(255,255,255,0.16)" }}>
      <div style={{ display: "flex", fontSize: 26, opacity: 0.85 }}>{label}</div>
      <div style={{ display: "flex", fontSize: 76 }}>{value}</div>
    </div>
  );
}

function PlayerImage({ card }: { card: PlayerCard }) {
  const { medals } = card;
  const details = [
    card.club,
    card.titles.length > 0 ? card.titles.join(" · ") : null,
    medals.gold + medals.silver + medals.bronze > 0 ? `${medals.gold} ouro · ${medals.silver} prata · ${medals.bronze} bronze` : null,
  ].filter(Boolean);
  return (
    <div style={frame}>
      {brand}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: card.name.length > 26 ? 64 : 84, lineHeight: 1.1 }}>{card.nickname || card.name}</div>
        {card.nickname ? <div style={{ display: "flex", fontSize: 36, opacity: 0.85, marginTop: 8 }}>{card.name}</div> : null}
        {details.length > 0 ? <div style={{ display: "flex", fontSize: 32, opacity: 0.85, marginTop: 16 }}>{details.join("  |  ")}</div> : null}
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <Rating label="Clássico" value={card.ratings.classic} />
        <Rating label="Rápido" value={card.ratings.rapid} />
        <Rating label="Blitz" value={card.ratings.blitz} />
      </div>
    </div>
  );
}

function PostImage({ card }: { card: PostCard }) {
  return (
    <div style={frame}>
      {brand}
      <div style={{ display: "flex", fontSize: card.title.length > 90 ? 52 : 68, lineHeight: 1.15 }}>{card.title}</div>
      <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>Notícias</div>
    </div>
  );
}

export async function renderOgPng(kind: "player" | "post", card: PlayerCard | PostCard): Promise<ArrayBuffer> {
  const element = kind === "player" ? <PlayerImage card={card as PlayerCard} /> : <PostImage card={card as PostCard} />;
  const response = await ImageResponse.async(element, { width: WIDTH, height: HEIGHT, format: "png" });
  return response.arrayBuffer();
}
