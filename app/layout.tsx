import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { AdInitializer } from '@/components/ads/ad-initializer'
import { ADSENSE_CLIENT, AD_BREAK_TEST_MODE, ADMOB_INTERSTITIAL_SLOT, ADMOB_REWARDED_SLOT } from '@/utils/config'
import { getAdBootstrapScript } from '@/utils/ads'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#1a1030',
}

export const metadata: Metadata = {
  title: 'Blocks 2048 - Merge Puzzle Game',
  description: 'A satisfying physics-based merge puzzle game. Drop blocks, match numbers, and reach 2048!',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {ADSENSE_CLIENT && (
          <>
            <Script id="google-ads-bootstrap" strategy="beforeInteractive">
              {getAdBootstrapScript()}
            </Script>
            <Script
              id="google-ads-sdk"
              strategy="afterInteractive"
              async
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
              data-adbreak-test={AD_BREAK_TEST_MODE ? 'on' : undefined}
              data-admob-interstitial-slot={ADMOB_INTERSTITIAL_SLOT || undefined}
              data-admob-rewarded-slot={ADMOB_REWARDED_SLOT || undefined}
            />
          </>
        )}
        {ADSENSE_CLIENT && <AdInitializer />}
        {children}
      </body>
    </html>
  )
}
