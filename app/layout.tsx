import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

const plusJakartaSans = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta-sans",
	subsets: ["latin"],
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
