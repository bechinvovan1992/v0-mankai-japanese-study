"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { allMockDatasets } from "@/lib/mock-data"
import type { Dataset, Question } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Database,
  BookOpen,
  Languages,
  Trash2,
  RotateCcw,
  Eye,
  Plus,
  CheckSquare,
  Square,
} from "lucide-react"
import { toast } from "sonner"

export function DatasetManager() {
  const {
    datasets,
    selectedDatasetIds,
    addDataset,
    removeDataset,
    selectDataset,
    deselectDataset,
    selectAllDatasets,
    deselectAllDatasets,
    resetDatasetPlayed,
  } = useAppStore()

  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)

  const handleLoadSampleData = () => {
    allMockDatasets.forEach((dataset) => {
      const exists = datasets.find((d) => d.id === dataset.id)
      if (!exists) {
        addDataset({
          ...dataset,
          id: `${dataset.id}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        })
      }
    })
    toast.success("Sample datasets loaded!")
  }

  const handleDelete = (id: string) => {
    removeDataset(id)
    toast.success("Dataset deleted")
  }

  const handleReset = (id: string) => {
    resetDatasetPlayed(id)
    toast.success("Play status reset")
  }

  const handleToggleSelect = (id: string) => {
    if (selectedDatasetIds.includes(id)) {
      deselectDataset(id)
    } else {
      selectDataset(id)
    }
  }

  const allSelected = datasets.length > 0 && selectedDatasetIds.length === datasets.length
  const someSelected = selectedDatasetIds.length > 0 && !allSelected

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={handleLoadSampleData} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Load Sample Data
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? deselectAllDatasets : selectAllDatasets}
          >
            {allSelected ? (
              <>
                <Square className="w-4 h-4 mr-1" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-1" />
                Select All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedDatasetIds.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong>{selectedDatasetIds.length}</strong> dataset(s) selected for game/flashcard
              </span>
              <Button variant="ghost" size="sm" onClick={deselectAllDatasets}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset List */}
      {datasets.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Datasets</h3>
            <p className="text-muted-foreground mb-4">
              Import a CSV file or load sample data to get started.
            </p>
            <Button onClick={handleLoadSampleData}>
              <Plus className="w-4 h-4 mr-2" />
              Load Sample Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {datasets.map((dataset) => {
            const isSelected = selectedDatasetIds.includes(dataset.id)
            const playedCount = dataset.questions.filter((q) => q.played).length
            const playedPercent = Math.round((playedCount / dataset.totalQuestions) * 100)

            return (
              <Card
                key={dataset.id}
                className={`border-border/50 transition-all ${
                  isSelected ? "border-primary ring-1 ring-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelect(dataset.id)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {dataset.type === 1 ? (
                          <BookOpen className="w-4 h-4 text-chart-3" />
                        ) : (
                          <Languages className="w-4 h-4 text-chart-4" />
                        )}
                        <h3 className="font-semibold truncate">{dataset.fileName}</h3>
                        <Badge variant={dataset.type === 1 ? "default" : "secondary"}>
                          {dataset.type === 1 ? "Grammar" : "Vocabulary"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{dataset.totalQuestions} questions</span>
                        <span>{formatDate(dataset.createdAt)}</span>
                        <span>
                          {playedCount}/{dataset.totalQuestions} played ({playedPercent}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${playedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewDataset(dataset)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReset(dataset.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(dataset.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDataset} onOpenChange={() => setPreviewDataset(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDataset?.fileName}</DialogTitle>
            <DialogDescription>
              {previewDataset?.totalQuestions} questions -{" "}
              {previewDataset?.type === 1 ? "Grammar" : "Vocabulary"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead className="w-20">Played</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewDataset?.questions.map((q, index) => (
                  <TableRow key={q.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-sm">
                      <p className="truncate">{q.question}</p>
                    </TableCell>
                    <TableCell>{q.correct}</TableCell>
                    <TableCell>
                      <Badge variant={q.played ? "default" : "outline"}>
                        {q.played ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
