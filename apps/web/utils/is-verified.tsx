import { Verified } from "lucide-react";

// !fill-[#EB1E32]

export function IsVerified(verified: boolean | null | undefined, shortName: string | null | undefined) {
    if (verified === true) {
        return <Verified className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-background mt-1" aria-label="Verificado" />
    // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (shortName === "Andrews") {
        return <Verified className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-background mt-1" aria-label="Verificado" />
    // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
        return
    }
}