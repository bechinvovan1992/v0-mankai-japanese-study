"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import type { Dataset } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Languages,
  Trash2,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  FolderOpen,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function DatasetManager() {
  const {
    datasets,
    selectedDatasetIds,
    selectDataset,
    deselectDataset,
    selectAllDatasets,
    deselectAllDatasets,
    resetDatasetPlayed,
    removeDataset,
    addDataset,
  } = useAppStore()

  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null)
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{ id: string; url: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter sheet names by search query
  const filteredSheetNames = sheetNames.filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load config and sheet names on mount
  useEffect(() => {
    loadConfig()
    loadSheetNames()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/google-sheets?action=getConfig")
      const data = await res.json()
      setSpreadsheetInfo({ id: data.spreadsheetId, url: data.spreadsheetUrl })
    } catch (error) {
      console.error("Error loading config:", error)
    }
  }

  const loadSheetNames = async () => {
    setIsLoadingSheets(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/google-sheets?action=getSheets")
      const data = await res.json()
      if (data.sheets) {
        setSheetNames(data.sheets)
        setErrorMessage(null)
        toast.success(`Da tai ${data.sheets.length} sheet`)
      } else if (data.error) {
        const errorMsg = `Loi: ${data.error}. ${data.details || ""}`
        setErrorMessage(errorMsg)
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading sheets:", error)
      setErrorMessage("Khong the ket noi den Google Sheets API")
      toast.error("Khong the tai danh sach sheet")
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const loadSheetData = async (sheetName: string) => {
    setSelectedSheet(sheetName)
    setIsLoadingSheetData(true)
    try {
      const res = await fetch(`/api/google-sheets?action=getSheetData&sheet=${encodeURIComponent(sheetName)}`)
      const data = await res.json()
      if (data.dataset) {
        // Check if dataset already exists
        const existingIndex = datasets.findIndex(d => d.fileName === sheetName)
        if (existingIndex === -1) {
          addDataset(data.dataset)
          toast.success(`Da tai ${data.dataset.questions?.length || 0} cau hoi tu "${sheetName}"`)
        } else {
          // Update existing dataset
          removeDataset(datasets[existingIndex].id)
          addDataset(data.dataset)
          toast.success(`Da cap nhat "${sheetName}" voi ${data.dataset.questions?.length || 0} cau hoi`)
        }
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading sheet data:", error)
      toast.error("Khong the tai du lieu sheet")
    } finally {
      setIsLoadingSheetData(false)
    }
  }

  const loadAllSheets = async () => {
    setIsLoadingSheetData(true)
    try {
      const res = await fetch("/api/google-sheets")
      const data = await res.json()
      if (data.datasets && data.datasets.length > 0) {
        // Clear existing and add new
        for (const ds of datasets) {
          removeDataset(ds.id)
        }
        for (const ds of data.datasets) {
          addDataset(ds)
        }
        toast.success(`Da tai ${data.datasets.length} bo du lieu`)
      } else {
        toast.info("Khong co du lieu de tai")
      }
    } catch (error) {
      console.error("Error loading all sheets:", error)
      toast.error("Khong the tai du lieu")
    } finally {
      setIsLoadingSheetData(false)
    }
  }

  const handleDelete = (id: string) => {
    removeDataset(id)
    toast.success("Da xoa bo du lieu")
  }

  const handleReset = (id: string) => {
    resetDatasetPlayed(id)
    toast.success("Da dat lai trang thai")
  }

  const handleToggleSelect = (id: string) => {
    if (selectedDatasetIds.includes(id)) {
      deselectDataset(id)
    } else {
      selectDataset(id)
    }
  }

  const allSelected = datasets.length > 0 && selectedDatasetIds.length === datasets.length

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
    <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Left Sidebar - Sheet Names */}
      <Card className="w-64 shrink-0 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Google Sheets
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadSheetNames}
              disabled={isLoadingSheets}
              className="h-8 w-8"
            >
              {isLoadingSheets ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllSheets}
            disabled={isLoadingSheetData || sheetNames.length === 0}
            className="w-full"
          >
            {isLoadingSheetData ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Tai tat ca
          </Button>
          
          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tim kiem sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingSheets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : errorMessage ? (
              <div className="p-4 text-sm">
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-3">
                  <p className="font-medium mb-2">Loi ket noi</p>
                  <p className="text-xs opacity-80">{errorMessage}</p>
                </div>
                {spreadsheetInfo && (
                  <div className="text-xs text-muted-foreground mt-3">
                    <p className="mb-1">Spreadsheet ID:</p>
                    <code className="bg-secondary px-2 py-1 rounded block overflow-x-auto">
                      {spreadsheetInfo.id}
                    </code>
                    <p className="mt-3 text-xs">
                      Dam bao Google Sheet da duoc chia se cong khai (Anyone with the link can view)
                    </p>
                  </div>
                )}
              </div>
            ) : sheetNames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Chua co sheet nao
                {spreadsheetInfo && (
                  <p className="text-xs mt-2 opacity-70">ID: {spreadsheetInfo.id}</p>
                )}
              </div>
            ) : filteredSheetNames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Khong tim thay "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSheetNames.map((name) => {
                  const isLoaded = datasets.some(d => d.fileName === name)
                  const isActive = selectedSheet === name
                  
                  return (
                    <button
                      key={name}
                      onClick={() => loadSheetData(name)}
                      disabled={isLoadingSheetData}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                        "hover:bg-primary/10 hover:text-primary",
                        isActive && "bg-primary/20 text-primary font-medium",
                        isLoaded && "border-l-2 border-primary"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{name}</span>
                        {isLoaded && (
                          <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                            Da tai
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Right Content - Dataset List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {selectedDatasetIds.length > 0 && (
            <Card className="border-chart-3/50 bg-chart-3/10 flex-1">
              <CardContent className="py-2 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-chart-3" />
                    <strong>{selectedDatasetIds.length}</strong> bo du lieu da chon
                  </span>
                  <Button variant="ghost" size="sm" onClick={deselectAllDatasets}>
                    Xoa lua chon
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? deselectAllDatasets : selectAllDatasets}
              disabled={datasets.length === 0}
            >
              {allSelected ? (
                <>
                  <Square className="w-4 h-4 mr-1" />
                  Bo chon tat ca
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Chon tat ca
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dataset List */}
        <ScrollArea className="flex-1">
          {datasets.length === 0 ? (
            <Card className="border-border/50 border-2 border-dashed">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Chua co bo du lieu</h3>
                <p className="text-muted-foreground mb-6">
                  Chon mot sheet tu danh sach ben trai de tai du lieu
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 pr-2">
              {datasets.map((dataset) => {
                const isSelected = selectedDatasetIds.includes(dataset.id)
                const playedCount = dataset.questions.filter((q) => q.played).length
                const playedPercent = Math.round((playedCount / dataset.totalQuestions) * 100)

                return (
                  <Card
                    key={dataset.id}
                    className={cn(
                      "border-border/50 transition-all hover:shadow-lg",
                      isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5"
                    )}
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
                              {dataset.type === 1 ? "Ngu phap" : "Tu vung"}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>{dataset.totalQuestions} cau hoi</span>
                            <span>{formatDate(dataset.createdAt)}</span>
                            <span>
                              {playedCount}/{dataset.totalQuestions} da choi ({playedPercent}%)
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
        </ScrollArea>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDataset} onOpenChange={() => setPreviewDataset(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {previewDataset?.fileName}
            </DialogTitle>
            <DialogDescription>
              {previewDataset?.totalQuestions} cau hoi -{" "}
              {previewDataset?.type === 1 ? "Ngu phap" : "Tu vung"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Cau hoi</TableHead>
                  <TableHead>Dap an dung</TableHead>
                  <TableHead className="w-24">Da choi</TableHead>
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
                        {q.played ? "Roi" : "Chua"}
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
