"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, BarChart3, UserCheck } from 'lucide-react'

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

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-8">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">政</span>
        </div>
        <span className="font-bold text-lg hidden sm:inline-block">
          政治家評価プラットフォーム
        </span>
      </Link>
      
      <div className="hidden md:flex items-center space-x-6">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}