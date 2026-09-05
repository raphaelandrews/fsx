import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Loader() {
  return (
    <div className="flex min-h-[50dvh] w-full items-center justify-center">
      <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
