import { Geist, Geist_Mono } from "next/font/google"
import { siteConfig } from "@/lib/site"

import "./globals.css"
import { Providers } from "@/components/providers"
import type { Metadata } from "next"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	description: siteConfig.description,
	keywords: [
		"Xadrez",
		"Sergipe",
		"Federação Sergipana de Xadrez",
		"FSX",
		"Aracaju",
		"Torneios",
		"Rating",
	],
	metadataBase: new URL(siteConfig.url),
	authors: [
		{
			name: "FSX",
			url: siteConfig.url,
		},
	],
	creator: "FSX",
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: siteConfig.url,
		title: siteConfig.name,
		description: siteConfig.description,
		siteName: siteConfig.name,
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.name,
		description: siteConfig.description,
		images: [`${siteConfig.url}/og.jpg`],
		creator: "@fsx",
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},
	manifest: `${siteConfig.url}/site.webmanifest`,
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
