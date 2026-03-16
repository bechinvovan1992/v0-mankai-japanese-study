"use client"

import { useState, useEffect } from "react"
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
  Sparkles,
  FolderOpen,
} from "lucide-react"
import { toast } from "sonner"

export function DatasetManager() {
  const {
    datasets,
    selectedDatasetIds,
    addDatasetAndSave,
    removeDatasetAndDelete,
    selectDataset,
    deselectDataset,
    selectAllDatasets,
    deselectAllDatasets,
    resetDatasetPlayed,
    loadDatasetsFromServer,
    isLoadingFromServer,
  } = useAppStore()

  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)

  // Load datasets from server on mount
  useEffect(() => {
    loadDatasetsFromServer()
  }, [loadDatasetsFromServer])

  const handleLoadSampleData = async () => {
    for (const dataset of allMockDatasets) {
      const exists = datasets.find((d) => d.id === dataset.id || d.fileName === dataset.fileName)
      if (!exists) {
        await addDatasetAndSave({
          ...dataset,
          id: `${dataset.id}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        })
      }
    }
    toast.success("Đã tải và lưu dữ liệu mẫu!")
  }

  const handleDelete = async (id: string) => {
    await removeDatasetAndDelete(id)
    toast.success("Đã xóa bộ dữ liệu")
  }

  const handleReset = (id: string) => {
    resetDatasetPlayed(id)
    toast.success("Đã đặt lại trạng thái")
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
    return new Date(dateString).toLocaleDateString("vi-VN", {
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
        <Button onClick={handleLoadSampleData} className="bg-gradient-fun hover:opacity-90">
          <Sparkles className="w-4 h-4 mr-2" />
          Tải dữ liệu mẫu
        </Button>
        <Button 
          variant="outline" 
          onClick={() => loadDatasetsFromServer()}
          disabled={isLoadingFromServer}
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${isLoadingFromServer ? "animate-spin" : ""}`} />
          {isLoadingFromServer ? "Đang tải..." : "Tải từ server"}
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
                Bỏ chọn tất cả
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-1" />
                Chọn tất cả
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedDatasetIds.length > 0 && (
        <Card className="border-primary/50 bg-primary/10">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <strong>{selectedDatasetIds.length}</strong> bộ dữ liệu đã chọn cho game/flashcard
              </span>
              <Button variant="ghost" size="sm" onClick={deselectAllDatasets}>
                Xóa lựa chọn
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset List */}
      {datasets.length === 0 ? (
        <Card className="border-border/50 border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Chưa có bộ dữ liệu</h3>
            <p className="text-muted-foreground mb-6">
              Nhập file CSV hoặc tải dữ liệu mẫu để bắt đầu.
            </p>
            <Button onClick={handleLoadSampleData} className="bg-gradient-fun hover:opacity-90">
              <Sparkles className="w-4 h-4 mr-2" />
              Tải dữ liệu mẫu
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
                className={`border-border/50 transition-all hover:shadow-lg ${
                  isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
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
                          <div className="w-8 h-8 rounded-lg bg-chart-3/20 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-chart-3" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-chart-4/20 flex items-center justify-center">
                            <Languages className="w-4 h-4 text-chart-4" />
                          </div>
                        )}
                        <h3 className="font-bold truncate">{dataset.fileName}</h3>
                        <Badge variant={dataset.type === 1 ? "default" : "secondary"} className="shrink-0">
                          {dataset.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{dataset.totalQuestions} câu hỏi</span>
                        <span>{formatDate(dataset.createdAt)}</span>
                        <span>
                          {playedCount}/{dataset.totalQuestions} đã chơi ({playedPercent}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-fun transition-all"
                          style={{ width: `${playedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewDataset(dataset)}
                        className="hover:bg-primary/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReset(dataset.id)}
                        className="hover:bg-warning/10"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(dataset.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {previewDataset?.fileName}
            </DialogTitle>
            <DialogDescription>
              {previewDataset?.totalQuestions} câu hỏi -{" "}
              {previewDataset?.type === 1 ? "Ngữ pháp" : "Từ vựng"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Câu hỏi</TableHead>
                  <TableHead>Đáp án đúng</TableHead>
                  <TableHead className="w-24">Đã chơi</TableHead>
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
                        {q.played ? "Rồi" : "Chưa"}
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
