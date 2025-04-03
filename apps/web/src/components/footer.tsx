import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  const emojis = [
    "🎉",
    "🔥",
    "🎊",
    "🍁",
    "🌴",
    "🐛",
    "👻",
    "🥤",
    "🏮",
    "⚫⚪",
    "🎒",
  ];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return (
    <footer className="py-6 md:py-0">
      <div className={cn(className, "flex items-center gap-4 md:h-24 m-auto")}>
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by {randomEmoji}{" "}
          <a
            href="https://ndrws.neocities.org/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sea hover:text-gold transition duration-200"
          >
            Andrews
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
