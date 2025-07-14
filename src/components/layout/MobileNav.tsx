"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Users, BarChart3, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

const navigationItems = [
  {
    name: 'ホーム',
    href: '/',
    icon: Home,
  },
  {
    name: '候補者一覧',
    href: '/candidates',
    icon: Users,
  },
  {
    name: '候補者比較',
    href: '/comparison',
    icon: BarChart3,
  },
  {
    name: '選挙情報',
    href: '/elections',
    icon: UserCheck,
  },
]

interface MobileNavProps {
  className?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  loading: boolean
}

export function MobileNav({ className, open, onOpenChange, user, loading }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className={cn("lg:hidden", className)}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">政</span>
          </div>
          <span className="font-bold text-lg">政治家評価</span>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(!open)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">メニューを開く</span>
        </Button>
      </div>
      
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold">メニュー</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <nav className="flex-1">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href))
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            
            <div className="border-t pt-4 mt-4">
              {loading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  読み込み中...
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/profile" onClick={() => onOpenChange(false)}>
                      プロフィール
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      // ログアウト処理
                      onOpenChange(false)
                    }}
                  >
                    ログアウト
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    asChild
                  >
                    <Link href="/login" onClick={() => onOpenChange(false)}>
                      ログイン
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link href="/register" onClick={() => onOpenChange(false)}>
                      新規登録
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}