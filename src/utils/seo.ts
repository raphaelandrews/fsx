import { siteConfig } from "./config"

export const seo = ({
  title,
  description,
  image = `${siteConfig.url}/og/og.jpg`,
  ogUrl = siteConfig.url,
  imageWidth = "1920",
  imageHeight = "1080"
}: {
  title: string
  description?: string
  image?: string
  ogUrl?: string
  imageWidth?: string
  imageHeight?: string
}) => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: siteConfig.keywords.join(", ") },
    { name: 'authors:name', content: siteConfig.authorsName },
    { name: 'authors:url', content: siteConfig.url },
    { name: 'creator', content: siteConfig.creator },

    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@_ndrws' },
    { name: 'twitter:site', content: '@_ndrws' },
    { name: 'twitter:image', content: image },
    { name: 'twitter:card', content: 'summary_large_image' },
    
    { name: 'og:type', content: 'website' },
    { name: 'og:locale', content: "pt_BR" },
    { name: 'og:url', content: ogUrl },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    { name: 'og:image', content: image },
    { name: 'og:image:width', content: imageWidth },
    { name: 'og:image:height', content: imageHeight },
  ]

  return tags
}
