import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '织造台｜把灵感做成商品', description: '面向创作者的商品设计与按需生产工作台' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="zh-CN"><body>{children}</body></html> }
