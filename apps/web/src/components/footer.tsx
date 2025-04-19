import { cn } from "~/lib/utils";

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
    <footer
      className={cn(
        "w-full border-t py-6 md:py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex items-center gap-4 h-24 max-w-[1400px] mx-auto px-4">
        <p className="text-balance text-sm leading-loose text-muted-foreground">
          Built with {randomEmoji} by{" "}
          <a
            href="https://ndrws.neocities.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors hover:text-primary"
          >
            Andrews
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
