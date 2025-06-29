import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlayIcon, RotateCcwIcon } from "lucide-react";
import { DynamicDock } from "./dynamic-dock";
import { MotionGridShowcase } from "./motion-grid-showcase";

export function DatabaseUpdateToolbar() {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md px-2.5 py-2 z-50">
      <div className="flex items-center">
        <Link href="/" prefetch={false} className="flex font-bold mt-0.5 px-2">
          FSX
        </Link>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <div className="flex gap-2">
          <Button size="sm">
            <PlayIcon className="mr-2 size-4" />
            Run
          </Button>
          <Button size="sm" variant="outline">
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
        </div>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <DynamicDock />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <MotionGridShowcase />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />
      </div>
    </div>
  );
}
