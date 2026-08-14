
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  Calendar01Icon,
  Link02Icon,
  InformationCircleIcon,
  Target01Icon,
  BarChartIcon,
  ChartBarLineIcon,
  ZapIcon,
  CrownIcon,
  Medal01Icon,
  TrainIcon,
} from "@hugeicons/core-free-icons"

import { columns } from "@/components/sheets/player/columns"
import { DataTable } from "@/components/sheets/player/data-table"

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Badge } from "@fsx/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select"
import { VerifiedBadge } from "@/components/player/verified-badge"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { TotalRatingChart, VariationChart } from "@/components/player/player-charts"

const meshGradients = [
  {
    backgroundColor: "#ff99e2",
    backgroundImage: `
      radial-gradient(at 73% 56%, hsla(313,90%,63%,1) 0px, transparent 50%),
      radial-gradient(at 68% 18%, hsla(222,78%,69%,1) 0px, transparent 50%),
      radial-gradient(at 33% 10%, hsla(350,80%,61%,1) 0px, transparent 50%),
      radial-gradient(at 89% 46%, hsla(149,69%,65%,1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#99f7ff",
    backgroundImage: `
      radial-gradient(at 92% 82%, hsla(307,83%,78%,1) 0px, transparent 50%),
      radial-gradient(at 68% 56%, hsla(177,93%,63%,1) 0px, transparent 50%),
      radial-gradient(at 10% 31%, hsla(118,81%,62%,1) 0px, transparent 50%),
      radial-gradient(at 94% 59%, hsla(150,87%,60%,1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#99e2ff",
    backgroundImage: `
      radial-gradient(at 93% 87%, hsla(347,88%,66%,1) 0px, transparent 50%),
      radial-gradient(at 83% 42%, hsla(204,66%,69%,1) 0px, transparent 50%),
      radial-gradient(at 93% 58%, hsla(5,99%,73%,1) 0px, transparent 50%),
      radial-gradient(at 43% 99%, hsla(6,71%,67%,1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#c599ff",
    backgroundImage: `
      radial-gradient(at 22% 54%, hsla(279,86%,60%,1) 0px, transparent 50%),
      radial-gradient(at 8% 6%, hsla(0,83%,76%,1) 0px, transparent 50%),
      radial-gradient(at 61% 68%, hsla(265,60%,78%,1) 0px, transparent 50%),
      radial-gradient(at 53% 33%, hsla(189,97%,61%,1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#99adff",
    backgroundImage: `
      radial-gradient(at 98% 14%, hsla(232,98%,60%,1) 0px, transparent 50%),
      radial-gradient(at 8% 18%, hsla(219,98%,66%,1) 0px, transparent 50%),
      radial-gradient(at 97% 60%, hsla(146,72%,60%,1) 0px, transparent 50%),
      radial-gradient(at 8% 48%, hsla(46,75%,70%,1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#ff6b6b",
    backgroundImage: `
      radial-gradient(at 10% 20%, hsla(0, 100%, 65%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 30%, hsla(10, 90%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 70%, hsla(20, 80%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 10%, hsla(30, 70%, 50%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f59e0b",
    backgroundImage: `
      radial-gradient(at 20% 80%, hsla(36, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 20%, hsla(40, 95%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 50%, hsla(30, 100%, 65%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 30%, hsla(45, 80%, 55%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#10b981",
    backgroundImage: `
      radial-gradient(at 30% 10%, hsla(142, 80%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 70% 20%, hsla(150, 90%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 60%, hsla(130, 70%, 45%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 90%, hsla(160, 60%, 50%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#3b82f6",
    backgroundImage: `
      radial-gradient(at 10% 90%, hsla(210, 90%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(220, 100%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 30%, hsla(200, 80%, 45%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 80%, hsla(230, 70%, 50%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#8b5cf6",
    backgroundImage: `
      radial-gradient(at 80% 10%, hsla(265, 80%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 30%, hsla(275, 90%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 70%, hsla(255, 70%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 40%, hsla(285, 60%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f43f5e",
    backgroundImage: `
      radial-gradient(at 85% 15%, hsla(350, 90%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 15% 20%, hsla(340, 80%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 55%, hsla(360, 70%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 30% 80%, hsla(10, 60%, 50%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#22c55e",
    backgroundImage: `
      radial-gradient(at 10% 80%, hsla(130, 80%, 45%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 20%, hsla(140, 90%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 35%, hsla(120, 70%, 40%, 1) 0px, transparent 50%),
      radial-gradient(at 70% 65%, hsla(150, 60%, 55%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#38bdf8",
    backgroundImage: `
      radial-gradient(at 75% 10%, hsla(200, 90%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 25% 25%, hsla(210, 70%, 45%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 40%, hsla(190, 80%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 95% 70%, hsla(220, 60%, 60%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#ec4899",
    backgroundImage: `
      radial-gradient(at 5% 50%, hsla(330, 80%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 95% 50%, hsla(340, 70%, 50%, 1) 0px, transparent 50%),
      radial-gradient(at 30% 20%, hsla(350, 90%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 70% 80%, hsla(10, 60%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#06b6d4",
    backgroundImage: `
            radial-gradient(at 80% 20%, hsla(180, 95%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 20% 80%, hsla(190, 80%, 65%, 1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(170, 90%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 90% 10%, hsla(200, 70%, 80%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#facc15",
    backgroundImage: `
            radial-gradient(at 10% 10%, hsla(50, 90%, 80%, 1) 0px, transparent 50%),
            radial-gradient(at 90% 90%, hsla(60, 70%, 65%, 1) 0px, transparent 50%),
            radial-gradient(at 30% 70%, hsla(40, 80%, 75%, 1) 0px, transparent 50%),
            radial-gradient(at 70% 30%, hsla(55, 60%, 85%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#059669",
    backgroundImage: `
            radial-gradient(at 20% 90%, hsla(160, 70%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 80% 10%, hsla(150, 80%, 60%, 1) 0px, transparent 50%),
            radial-gradient(at 50% 40%, hsla(140, 60%, 80%, 1) 0px, transparent 50%),
            radial-gradient(at 10% 20%, hsla(170, 50%, 85%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#8b5cf6",
    backgroundImage: `
            radial-gradient(at 90% 80%, hsla(280, 60%, 75%, 1) 0px, transparent 50%),
            radial-gradient(at 10% 20%, hsla(270, 70%, 65%, 1) 0px, transparent 50%),
            radial-gradient(at 60% 60%, hsla(290, 50%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 30% 30%, hsla(300, 40%, 80%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#f43f5e",
    backgroundImage: `
            radial-gradient(at 30% 10%, hsla(320, 50%, 75%, 1) 0px, transparent 50%),
            radial-gradient(at 70% 90%, hsla(330, 60%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 10% 50%, hsla(340, 40%, 85%, 1) 0px, transparent 50%),
            radial-gradient(at 90% 40%, hsla(350, 50%, 80%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#6ee7b7",
    backgroundImage: `
      radial-gradient(at 50% 0%, hsla(160, 80%, 75%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(177, 90%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, hsla(171, 88%, 75%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(164, 95%, 73%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#86efac",
    backgroundImage: `
      radial-gradient(at 50% 0%, hsla(140, 70%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(157, 71%, 75%, 1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, hsla(151, 68%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(144, 75%, 78%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f0abfc",
    backgroundImage: `
      radial-gradient(at 50% 0%, hsla(320, 60%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(337, 61%, 75%, 1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, hsla(331, 58%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(324, 65%, 78%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#a3e635",
    backgroundImage: `
      radial-gradient(at 50% 0%, hsla(70, 80%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(87, 71%, 55%, 1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, hsla(81, 68%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(74, 75%, 58%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#fdba74",
    backgroundImage: `
            radial-gradient(at 10% 10%, hsla(30, 90%, 70%, 1) 0px, transparent 50%),
            radial-gradient(at 90% 90%, hsla(20, 70%, 65%, 1) 0px, transparent 50%),
            radial-gradient(at 30% 70%, hsla(10, 80%, 75%, 1) 0px, transparent 50%),
            radial-gradient(at 70% 30%, hsla(25, 60%, 80%, 1) 0px, transparent 50%)
        `,
  },
  {
    backgroundColor: "#ffb347",
    backgroundImage: `
      radial-gradient(at 80% 20%, hsla(39, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 80%, hsla(25, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 60%, hsla(50, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 40%, hsla(15, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#ff5e62",
    backgroundImage: `
      radial-gradient(at 10% 90%, hsla(350, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 10%, hsla(340, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(0, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 80%, hsla(355, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#43e97b",
    backgroundImage: `
      radial-gradient(at 70% 30%, hsla(150, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 30% 70%, hsla(160, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 80%, hsla(140, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(170, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#38f9d7",
    backgroundImage: `
      radial-gradient(at 60% 10%, hsla(180, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 60%, hsla(170, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(190, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 80%, hsla(200, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#a770ef",
    backgroundImage: `
      radial-gradient(at 80% 80%, hsla(260, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(240, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 40%, hsla(270, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 60%, hsla(230, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f7971e",
    backgroundImage: `
      radial-gradient(at 10% 10%, hsla(30, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(40, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(20, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(50, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f953c6",
    backgroundImage: `
      radial-gradient(at 20% 80%, hsla(320, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(300, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 60%, hsla(340, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 40%, hsla(330, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#00c3ff",
    backgroundImage: `
      radial-gradient(at 70% 30%, hsla(200, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 30% 70%, hsla(210, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 80%, hsla(190, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(220, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#fdc830",
    backgroundImage: `
      radial-gradient(at 60% 10%, hsla(50, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 60%, hsla(60, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(40, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 80%, hsla(30, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f7797d",
    backgroundImage: `
      radial-gradient(at 80% 80%, hsla(350, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(360, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 40%, hsla(340, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 60%, hsla(10, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#4e54c8",
    backgroundImage: `
      radial-gradient(at 10% 10%, hsla(240, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(250, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(230, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(260, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#43cea2",
    backgroundImage: `
      radial-gradient(at 20% 80%, hsla(160, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(140, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 60%, hsla(180, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 40%, hsla(170, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#ffaf7b",
    backgroundImage: `
      radial-gradient(at 70% 30%, hsla(30, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 30% 70%, hsla(20, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 80%, hsla(40, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(10, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#b721ff",
    backgroundImage: `
      radial-gradient(at 60% 10%, hsla(270, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 60%, hsla(280, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(260, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 80%, hsla(250, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f857a6",
    backgroundImage: `
      radial-gradient(at 80% 80%, hsla(320, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 20% 20%, hsla(330, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 40%, hsla(310, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 60%, hsla(300, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#00f2fe",
    backgroundImage: `
      radial-gradient(at 10% 10%, hsla(190, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 90% 90%, hsla(200, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 50% 50%, hsla(180, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(210, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
  {
    backgroundColor: "#f7971e",
    backgroundImage: `
      radial-gradient(at 20% 80%, hsla(40, 100%, 70%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 20%, hsla(30, 100%, 60%, 1) 0px, transparent 50%),
      radial-gradient(at 60% 60%, hsla(50, 100%, 80%, 1) 0px, transparent 50%),
      radial-gradient(at 40% 40%, hsla(20, 100%, 65%, 1) 0px, transparent 50%)
    `,
  },
]

const getGradient = (seed?: number) => {
  const index =
    seed !== undefined
      ? Math.abs(seed) % meshGradients.length
      : Math.floor(Math.random() * meshGradients.length)

  return meshGradients[index]
}

function FormatPodium(
  place: number | null | undefined,
  championship_id: number
) {
  if (place === 1 && championship_id === 1) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />
  }

  if (place === 1 && championship_id === 2) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />
  }

  if (place === 1 && championship_id === 3) {
    return <HugeiconsIcon icon={ZapIcon} className="size-4" />
  }

  if (place === 1 && championship_id === 4) {
    return <HugeiconsIcon icon={CrownIcon} className="size-4" />
  }

  if (place === 1 && championship_id === 5) {
    return <HugeiconsIcon icon={ZapIcon} className="size-4" />
  }

  if (place === 1 && championship_id === 6) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />
  }

  if (place === 2) {
    return <HugeiconsIcon icon={Medal01Icon} className="size-4" />
  }
}

function FormatPodiumTitle(place: number | null | undefined) {
  if (place === 1) {
    return "Campeão(ã)"
  }
  if (place === 2) {
    return "Vice-Campeão(ã)"
  }
}

function formatDefendingChampions(championship: string) {
  if (championship === "Absoluto") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
      </Popover>
    )
  }

  if (championship === "Rápido") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
      </Popover>
    )
  }

  if (championship === "Blitz") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
      </Popover>
    )
  }

  if (championship === "Feminino") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={CrownIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
      </Popover>
    )
  }

  if (championship === "Equipes") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
      </Popover>
    )
  }
}

export interface PlayerById {
  id: number
  name: string
  nickname?: string | null
  imageUrl?: string | null
  verified?: boolean | null
  active?: boolean | null
  classic?: number | null
  rapid?: number | null
  blitz?: number | null
  cbxId?: number | null
  fideId?: number | null
  playersToTournaments?: Array<{
    variation: number
    oldRating: number
    tournament: {
      name: string
      ratingType: string
      championshipId?: number | null
    }
  }>
  playersToRoles?: Array<{
    role: {
      type: string
      name: string
    }
  }>
  playersToTitles?: Array<{
    title: {
      type: string
      shortName: string
      name: string
    }
  }>
  tournamentPodiums?: Array<{
    place: number | null
    tournament: {
      name: string
      championshipId?: number | null
    }
  }>
  defendingChampions?: Array<{
    championship: {
      name: string
    }
  }>
  club?: {
    name: string
    logoUrl?: string | null
  } | null
  location?: {
    name: string
    flagUrl?: string | null
  } | null
}

export function PlayerProfile({ player }: { player: PlayerById }) {
  const useGradients = () => {
    const [headerGradient, avatarGradient] = React.useMemo(
      () => [getGradient(player.id), getGradient(player.id + 1)],
      [player.id]
    )
    return { headerGradient, avatarGradient }
  }
  const { headerGradient, avatarGradient } = useGradients()

  const orderPodiums = React.useMemo(() => {
    return player?.tournamentPodiums
      ? [...player.tournamentPodiums].reverse()
      : []
  }, [player?.tournamentPodiums])

  const tournaments = React.useMemo(() => {
    return player?.playersToTournaments
      ? [...player.playersToTournaments].reverse()
      : []
  }, [player?.playersToTournaments])

  const managementRole = React.useMemo(() => {
    return player?.playersToRoles?.find(
      (role) => role.role.type === "management"
    )
  }, [player?.playersToRoles])

  const refereeRole = React.useMemo(() => {
    return player?.playersToRoles?.find((role) => role.role.type === "referee")
  }, [player?.playersToRoles])

  const internalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "internal"
    )
  }, [player?.playersToTitles])

  const externalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "external"
    )
  }, [player?.playersToTitles])

  const [selectedRatingType, setSelectedRatingType] = React.useState("rapid")

  return (
    <>
      {/* Header Section */}
      <div className="relative">
        <div className="h-32 w-full bg-cover bg-center rounded-t-lg sm:rounded-none" style={headerGradient} />
        <div className="px-4 pb-4">
          <div className="-mt-12 mb-4 flex justify-center">
            <Avatar className="h-24 w-24 rounded-[20px] border-4 border-background shadow-sm">
              <AvatarImage
                alt={player.name}
                src={player.imageUrl ?? ""}
                className="h-full w-full object-cover"
              />
              <AvatarFallback style={avatarGradient} className="rounded-[16px]" />
            </Avatar>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold tracking-tight">
                {internalTitle && (
                  <span className="text-highlight mr-1.5">
                    {internalTitle.title.shortName}
                  </span>
                )}
                {player.nickname || player.name}
              </h1>
              <VerifiedBadge
                playerId={player.id}
                roles={player.playersToRoles ?? []}
                verified={player.verified ?? false}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {(managementRole || refereeRole) && (
                <>
                  {managementRole && (
                    <Badge variant="secondary">{managementRole.role.name}</Badge>
                  )}
                  {refereeRole && (
                    <Badge variant="default">{refereeRole.role.name}</Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {(orderPodiums.length > 0 || (player.defendingChampions && player.defendingChampions?.length > 0)) && (
        <section className="mb-0">
          <Announcement icon={Target01Icon} label="Conquistas" className="text-sm" topSeparator />
          <div className="p-3 grid gap-4">
            {player.defendingChampions && player.defendingChampions?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {player.defendingChampions?.map((championship) => (
                  <div key={championship.championship.name}>
                    {formatDefendingChampions(championship.championship.name)}
                  </div>
                ))}
              </div>
            )}

            {orderPodiums.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {orderPodiums.map((podium) => (
                  <Popover key={podium.place + podium.tournament.name}>
                    <PopoverTrigger className="rounded-md bg-muted p-2 text-xs font-medium transition-colors">
                      {FormatPodium(
                        podium.place,
                        podium.tournament.championshipId ?? 0
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 text-xs font-medium">
                      {FormatPodiumTitle(podium.place)} {podium.tournament.name}
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="mb-0">
        <Announcement icon={InformationCircleIcon} label="Informações" className="text-sm" topSeparator />

        <div className="flex flex-col">
          <InfoItem label="Nome Completo" value={player.name} isFirst />

          {internalTitle && (
            <InfoItem label="Titulação FSX" value={internalTitle.title.name} />
          )}

          {externalTitle && (
            <InfoItem label="Titulação CBX/FIDE" value={externalTitle.title.name} />
          )}

          {player.club && (
            <InfoItem label="Clube">
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-sm">
                  <AvatarImage
                    alt={player.club.name as string}
                    className="object-contain"
                    src={
                      (player.club.logoUrl as string)
                        ? (player.club.logoUrl as string)
                        : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                    }
                  />
                  <AvatarFallback className="rounded-none bg-transparent" />
                </Avatar>
                <span>{player.club.name}</span>
              </div>
            </InfoItem>
          )}

          {player.location && (
            <InfoItem label="Localização">
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-sm">
                  <AvatarImage
                    alt={player.location.name as string}
                    className="object-contain"
                    src={
                      (player.location.flagUrl as string)
                        ? (player.location.flagUrl as string)
                        : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                    }
                  />
                  <AvatarFallback className="rounded-none bg-transparent" />
                </Avatar>
                <span>{player.location.name}</span>
              </div>
            </InfoItem>
          )}

          {player.active ? (
            <InfoItem label="Status">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                <p>Ativo</p>
              </div>
            </InfoItem>
          ) : (
            <InfoItem label="Status">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                </span>
                <p>Inativo</p>
              </div>
            </InfoItem>
          )}
        </div>
      </section>

      {/* Ratings Section */}
      <section className="mb-0">
        <Announcement icon={ChartBarLineIcon} label="Ratings" className="text-sm" topSeparator />

        <div className="grid grid-cols-3 divide-x divide-border">
          <RatingBox label="Clássico" value={player.classic} />
          <RatingBox label="Rápido" value={player.rapid} />
          <RatingBox label="Blitz" value={player.blitz} />
        </div>
      </section>

      {/* IDs Section */}
      <section className="mb-0">
        <Announcement icon={Link02Icon} label="IDs" className="text-sm" topSeparator />

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-border">
          <IdBox label="ID FSX" value={String(player.id)} />
          <IdBox
            label="ID CBX"
            value={player.cbxId ? String(player.cbxId) : "-"}
            href={player.cbxId ? `https://www.cbx.org.br/jogador/${player.cbxId}` : undefined}
          />
          <IdBox
            label="ID FIDE"
            value={player.fideId ? String(player.fideId) : "-"}
            href={player.fideId ? `https://ratings.fide.com/profile/${player.fideId}` : undefined}
          />
        </div>
      </section>

      {/* Performance Section */}
      {tournaments.length > 0 && (
        <section className="mb-0">

          <Announcement icon={BarChartIcon} label="Performance" className="text-sm flex-1" topSeparator />

          <div className="p-4 space-y-6">
            <Select
              onValueChange={(value) => value && setSelectedRatingType(value)}
              value={selectedRatingType}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Clássico</SelectItem>
                <SelectItem value="rapid">Rápido</SelectItem>
                <SelectItem value="blitz">Blitz</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground ml-2">Variação de Rating</h4>
              <VariationChart
                player={player}
                selectedRatingType={selectedRatingType}
              />
            </div>

            <DottedSeparator className="w-full" />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground ml-2">Evolução de Rating</h4>
              <TotalRatingChart
                player={player}
                selectedRatingType={selectedRatingType}
              />
            </div>
          </div>
        </section>
      )}

      {/* Tournaments Section */}
      {tournaments && tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={Calendar01Icon} label="Histórico de Torneios" className="text-sm" topSeparator />
          <div className="py-4">
            <DataTable columns={columns} data={tournaments} />
          </div>
        </section>
      )}
    </>
  )
}

function InfoItem({ label, value, children, isFirst }: { label: string, value?: string, children?: React.ReactNode, isFirst?: boolean }) {
  return (
    <>
      {!isFirst && <DottedSeparator className="w-full" />}
      <div className="m-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-muted/50 transition-colors duration-200">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="mt-1 sm:mt-0 text-sm font-medium text-foreground">
            {children ? children : value}
          </div>
        </div>
      </div>
    </>
  )
}

function RatingBox({ label, value }: { label: string, value?: number | null }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors duration-200">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-base font-semibold mt-1 text-primary">{value ?? "-"}</span>
    </div>
  )
}

function IdBox({ label, value, href }: { label: string, value: string, href?: string }) {
  const content = (
    <div className="p-4 flex flex-col items-center justify-center transition-colors duration-200 group h-full hover:bg-muted/50">
      <span className="text-sm font-medium transition-colors text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-base font-semibold transition-colors ${href ? "group-hover:underline" : "text-foreground"}`}>{value}</span>
        {href && <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3 text-muted-foreground" />}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {content}
      </a>
    )
  }

  return content
}
