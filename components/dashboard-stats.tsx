"use client"

import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Database,
  HelpCircle,
  BookOpen,
  Languages,
  Gamepad2,
  BookMarked,
  Settings,
  Sparkles,
  Star,
} from "lucide-react"

export function DashboardStats() {
  const { datasets } = useAppStore()

  const totalDatasets = datasets.length
  const totalQuestions = datasets.reduce((acc, d) => acc + d.totalQuestions, 0)
  const grammarDatasets = datasets.filter((d) => d.type === 1).length
  const vocabularyDatasets = datasets.filter((d) => d.type === 2).length

  const stats = [
    {
      title: "Tổng bộ dữ liệu",
      value: totalDatasets,
      icon: Database,
      color: "text-chart-1",
      bgColor: "bg-chart-1/15",
    },
    {
      title: "Tổng câu hỏi",
      value: totalQuestions,
      icon: HelpCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/15",
    },
    {
      title: "Ngữ pháp",
      value: grammarDatasets,
      icon: BookOpen,
      color: "text-chart-3",
      bgColor: "bg-chart-3/15",
    },
    {
      title: "Từ vựng",
      value: vocabularyDatasets,
      icon: Languages,
      color: "text-chart-4",
      bgColor: "bg-chart-4/15",
    },
  ]

  const quickActions = [
    {
      title: "Trò chơi",
      description: "Chọn dữ liệu, người chơi và bắt đầu",
      href: "/game",
      icon: Gamepad2,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Ôn tập",
      description: "Ôn tập với thẻ ghi nhớ",
      href: "/review",
      icon: BookMarked,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Cài đặt",
      description: "Cấu hình API Key & giao diện",
      href: "/settings",
      icon: Settings,
      gradient: "from-amber-500 to-orange-500",
    },
  ]

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Welcome Banner */}
      <Card className="border-0 bg-gradient-fun text-primary-foreground overflow-hidden relative">
        <CardContent className="p-4 md:p-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Chào mừng bạn!</h2>
              <p className="text-sm md:text-base text-primary-foreground/80">
                Sẵn sàng chinh phục tiếng Nhật nào!
              </p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <Star className="w-24 h-24 md:w-32 md:h-32" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-3 md:p-5">
                <div className="flex flex-col gap-2 md:gap-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          Bắt đầu nhanh
        </h2>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group h-full active:scale-95">
                  <CardContent className="p-3 md:p-5">
                    <div className="flex flex-col items-center md:items-start gap-2 md:gap-3">
                      <div className={`w-12 h-12 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="font-bold text-sm md:text-base">{action.title}</h3>
                        <p className="text-xs text-muted-foreground hidden md:block">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity / Getting Started */}
      {totalDatasets === 0 ? (
        <Card className="border-border/50 border-2 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning" />
              Hướng dẫn bắt đầu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h4 className="font-bold">Nhập bộ dữ liệu đầu tiên</h4>
                <p className="text-sm text-muted-foreground">
                  Vào trang Nhập CSV để tải file câu hỏi, hoặc tải dữ liệu mẫu từ trang Bộ dữ liệu.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h4 className="font-bold">Thêm người chơi</h4>
                <p className="text-sm text-muted-foreground">
                  Thêm 1-20 người chơi để thi đấu trong trò chơi quiz.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h4 className="font-bold">Bắt đầu học thôi!</h4>
                <p className="text-sm text-muted-foreground">
                  Chơi game bảng hoặc ôn tập với flashcard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Bộ dữ liệu của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {datasets.slice(0, 5).map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {dataset.type === 1 ? (
                      <div className="w-8 h-8 rounded-lg bg-chart-3/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-chart-3" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-chart-4/20 flex items-center justify-center">
                        <Languages className="w-4 h-4 text-chart-4" />
                      </div>
                    )}
                    <span className="font-medium">{dataset.fileName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dataset.totalQuestions} câu hỏi
                  </span>
                </div>
              ))}
              {datasets.length > 5 && (
                <Link href="/datasets">
                  <Button variant="ghost" className="w-full">
                    Xem tất cả {datasets.length} bộ dữ liệu
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
