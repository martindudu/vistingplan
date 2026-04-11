/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel 會自動處理 NEXT_PUBLIC_ 開頭的環境變數，不需要在 env 中手動設定
  images: {
    domains: ['maps.googleapis.com'], // 如果之後改用 next/image，這能授權抓取 Google 地圖的照片
  },
}

module.exports = nextConfig
