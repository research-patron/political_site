"use client"

import { useState } from 'react'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/lib/contexts/AuthContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <header className="hidden lg:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Navigation />
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserMenu user={user} loading={loading} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <MobileNav 
        className="lg:hidden" 
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        user={user}
        loading={loading}
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">政治家評価プラットフォーム</h3>
              <p className="text-sm text-muted-foreground mb-4">
                候補者の公約を客観的に評価・分析し、分かりやすく可視化するWebアプリケーション
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サイトマップ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/candidates" className="text-muted-foreground hover:text-foreground">候補者一覧</a></li>
                <li><a href="/elections" className="text-muted-foreground hover:text-foreground">選挙情報</a></li>
                <li><a href="/comparison" className="text-muted-foreground hover:text-foreground">候補者比較</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-muted-foreground hover:text-foreground">サービス概要</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground">プライバシーポリシー</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground">利用規約</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 政治家評価プラットフォーム. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}