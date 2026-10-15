import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const LOGO_FALLBACK =
	"https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"

export const OG_IMAGE = "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETtW1xZQjr5VdDzvQRnMl9xZGwUfgWIcs1mHeF"

export const API_URL = process.env.NEXT_PUBLIC_API_URL
