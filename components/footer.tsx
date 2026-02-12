import { cn } from "@/lib/utils"
import { DottedX } from "./dotted-x";

export function Footer({ className }: { className?: string }) {
  return (
    <footer>
      <DottedX>
        <div className="text-balance text-center text-muted-foreground text-sm leading-loose">
          Built by 🏝️{" "}
          <a
            className="font-medium text-bulbasaur-foreground transition duration-200 hover:text-amber-500"
            href="https://andrews.sh/"
            rel="noreferrer"
            target="_blank"
          >
            Andrews
          </a>
          .{" "}
          <a
            className="font-medium transition duration-200 hover:text-amber-500"
            href="https://github.com/raphaelandrews/fsx"
            rel="noreferrer"
            target="_blank"
          >
            Source code
          </a>
          .
        </div>
      </DottedX>
    </footer>
  );
}
