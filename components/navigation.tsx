"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Gamepad2,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/game", label: "Trò chơi", icon: Gamepad2 },
  { href: "/review", label: "Ôn tập", icon: BookOpen },
  { href: "/settings", label: "Cài đặt", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navigation - Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-sidebar border-r border-sidebar-border p-4 z-40">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-fun flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-sidebar-foreground">Học Từ vựng</h1>
              <p className="text-xs text-muted-foreground">Ôn Tập Tiếng Nhật</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="pt-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            Chúc bạn học vui vẻ!
          </p>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Tab Bar (App-like) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md scale-105" 
                    : "hover:bg-sidebar-accent"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-lg border-b border-sidebar-border">
        <div className="flex items-center justify-center h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-fun flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Học Từ vựng</span>
          </Link>
        </div>
      </header>
    </>
  )
}
