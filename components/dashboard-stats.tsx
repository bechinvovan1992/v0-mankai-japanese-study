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
  Upload,
  Gamepad2,
  BookMarked,
  Settings,
} from "lucide-react"

export function DashboardStats() {
  const { datasets } = useAppStore()

  const totalDatasets = datasets.length
  const totalQuestions = datasets.reduce((acc, d) => acc + d.totalQuestions, 0)
  const grammarDatasets = datasets.filter((d) => d.type === 1).length
  const vocabularyDatasets = datasets.filter((d) => d.type === 2).length

  const stats = [
    {
      title: "Total Datasets",
      value: totalDatasets,
      icon: Database,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Total Questions",
      value: totalQuestions,
      icon: HelpCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Grammar Sets",
      value: grammarDatasets,
      icon: BookOpen,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Vocabulary Sets",
      value: vocabularyDatasets,
      icon: Languages,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  const quickActions = [
    {
      title: "Import CSV",
      description: "Add new questions from CSV file",
      href: "/import",
      icon: Upload,
      variant: "default" as const,
    },
    {
      title: "Start Game",
      description: "Play multiplayer quiz game",
      href: "/game",
      icon: Gamepad2,
      variant: "secondary" as const,
    },
    {
      title: "Flashcard Study",
      description: "Review with flashcards",
      href: "/flashcard",
      icon: BookMarked,
      variant: "secondary" as const,
    },
    {
      title: "Manage Data",
      description: "View and manage datasets",
      href: "/datasets",
      icon: Settings,
      variant: "secondary" as const,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-4 rounded-xl bg-secondary group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
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
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium">Import your first dataset</h4>
                <p className="text-sm text-muted-foreground">
                  Go to Import CSV and upload your question file, or load sample data from datasets page.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium">Add players for game mode</h4>
                <p className="text-sm text-muted-foreground">
                  Add 1-20 players to compete in the quiz game.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium">Start learning!</h4>
                <p className="text-sm text-muted-foreground">
                  Play the board game or study with flashcards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {datasets.slice(0, 5).map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    {dataset.type === 1 ? (
                      <BookOpen className="w-4 h-4 text-chart-3" />
                    ) : (
                      <Languages className="w-4 h-4 text-chart-4" />
                    )}
                    <span className="font-medium">{dataset.fileName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dataset.totalQuestions} questions
                  </span>
                </div>
              ))}
              {datasets.length > 5 && (
                <Link href="/datasets">
                  <Button variant="ghost" className="w-full">
                    View all {datasets.length} datasets
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
