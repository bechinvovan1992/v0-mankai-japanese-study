"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Dataset, GameMode } from "@/lib/types"
import {
  Database,
  Users,
  Play,
  Plus,
  Trash2,
  Shuffle,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
  UserPlus,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Zap,
  EyeOff,
  ThumbsUp,
  Skull,
  Swords,
  HelpCircle,
  Timer,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const gameModes: { id: GameMode; name: string; description: string; icon: React.ElementType }[] = [
  { id: "guess", name: "Doan dap an", description: "Tra loi mieng, sau do xem dap an", icon: HelpCircle },
  { id: "multiple", name: "Trac nghiem", description: "Chon 1 trong 4 dap an", icon: Target },
  { id: "elimination", name: "Loai tru", description: "Loai 2 dap an sai truoc", icon: Zap },
  { id: "speed", name: "Toc do", description: "Tra loi trong 10 giay", icon: Timer },
  { id: "hidden", name: "An dap an", description: "Dap an an 3 giay dau", icon: EyeOff },
  { id: "truefalse", name: "Dung/Sai", description: "Doan dap an dung hay sai", icon: ThumbsUp },
  { id: "suddendeath", name: "Sinh tu", description: "Tra loi sai bi loai", icon: Skull },
  { id: "teambattle", name: "Doi khang", description: "2 doi thi dau", icon: Swords },
]

export function GameSetup({ onStartGame }: { onStartGame: () => void }) {
  const {
    datasets,
    selectedDatasetIds,
    players,
    settings,
    selectDataset,
    deselectDataset,
    selectAllDatasets,
    deselectAllDatasets,
    addPlayer,
    updatePlayer,
    removePlayer,
    randomizePlayers,
    resetPlayers,
    selectedGameMode,
    setGameMode,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState("datasets")
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<{ id: string; name: string } | null>(null)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [bulkNames, setBulkNames] = useState("")

  // Filter sheet names by search
  const filteredSheetNames = sheetNames.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load sheets on mount
  useEffect(() => {
    loadSheetNames()
  }, [])

  const loadSheetNames = async () => {
    setIsLoadingSheets(true)
    try {
      const apiKey = settings.googleApiKey
      const res = await fetch(`/api/google-sheets?action=getSheets&apiKey=${encodeURIComponent(apiKey)}`)
      const data = await res.json()
      if (data.sheets) {
        setSheetNames(data.sheets)
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading sheets:", error)
      toast.error("Khong the tai danh sach sheet")
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const loadSheetData = async (sheetName: string) => {
    setIsLoadingSheetData(true)
    try {
      const apiKey = settings.googleApiKey
      const res = await fetch(`/api/google-sheets?action=getSheetData&sheetName=${encodeURIComponent(sheetName)}&apiKey=${encodeURIComponent(apiKey)}`)
      const data = await res.json()
      if (data.dataset) {
        const { addDataset } = useAppStore.getState()
        const exists = datasets.find(d => d.fileName === sheetName)
        if (!exists) {
          addDataset(data.dataset)
          selectDataset(data.dataset.id)
        } else {
          selectDataset(exists.id)
        }
        toast.success(`Da tai ${data.dataset.totalQuestions} cau hoi tu "${sheetName}"`)
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading sheet:", error)
      toast.error("Khong the tai du lieu sheet")
    } finally {
      setIsLoadingSheetData(false)
    }
  }

  const loadAllSheets = async () => {
    setIsLoadingSheetData(true)
    try {
      const apiKey = settings.googleApiKey
      const res = await fetch(`/api/google-sheets?action=getAllData&apiKey=${encodeURIComponent(apiKey)}`)
      const data = await res.json()
      if (data.datasets) {
        const { addDataset } = useAppStore.getState()
        let added = 0
        data.datasets.forEach((dataset: Dataset) => {
          const exists = datasets.find(d => d.fileName === dataset.fileName)
          if (!exists) {
            addDataset(dataset)
            added++
          }
        })
        selectAllDatasets()
        toast.success(`Da tai ${data.datasets.length} sheet (${added} moi)`)
      }
    } catch (error) {
      console.error("Error loading all sheets:", error)
      toast.error("Khong the tai tat ca sheet")
    } finally {
      setIsLoadingSheetData(false)
    }
  }

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim())
      setNewPlayerName("")
      toast.success(`Da them nguoi choi: ${newPlayerName}`)
    }
  }

  const handleBulkAdd = () => {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(n => n)
    names.forEach(name => addPlayer(name))
    setBulkNames("")
    setBulkAddOpen(false)
    toast.success(`Da them ${names.length} nguoi choi`)
  }

  const canStart = selectedDatasetIds.length > 0 && players.length > 0

  const selectedQuestionCount = datasets
    .filter(d => selectedDatasetIds.includes(d.id))
    .reduce((sum, d) => sum + d.questions.filter(q => !q.played).length, 0)

  const goToNextTab = () => {
    if (activeTab === "datasets") setActiveTab("players")
    else if (activeTab === "players") setActiveTab("start")
  }

  const goToPrevTab = () => {
    if (activeTab === "start") setActiveTab("players")
    else if (activeTab === "players") setActiveTab("datasets")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-14">
          <TabsTrigger value="datasets" className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">1. Chon du lieu</span>
            <span className="sm:hidden">Du lieu</span>
            {selectedDatasetIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">{selectedDatasetIds.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">2. Nguoi choi</span>
            <span className="sm:hidden">Nguoi choi</span>
            {players.length > 0 && (
              <Badge variant="secondary" className="ml-1">{players.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="start" className="flex items-center gap-2 text-sm">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">3. Bat dau</span>
            <span className="sm:hidden">Bat dau</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dataset Selection */}
        <TabsContent value="datasets" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sheet List Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Google Sheets
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSheetNames}
                    disabled={isLoadingSheets}
                    className="flex-1"
                  >
                    {isLoadingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={loadAllSheets}
                    disabled={isLoadingSheetData || sheetNames.length === 0}
                    className="flex-1"
                  >
                    {isLoadingSheetData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="ml-1">Tat ca</span>
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tim sheet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {isLoadingSheets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredSheetNames.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm px-4">
                      {searchQuery ? `Khong tim thay "${searchQuery}"` : "Chua co sheet nao"}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredSheetNames.map((name) => {
                        const loaded = datasets.find(d => d.fileName === name)
                        const isSelected = loaded && selectedDatasetIds.includes(loaded.id)
                        return (
                          <button
                            key={name}
                            onClick={() => loaded ? (isSelected ? deselectDataset(loaded.id) : selectDataset(loaded.id)) : loadSheetData(name)}
                            disabled={isLoadingSheetData}
                            className={cn(
                              "w-full p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : loaded
                                ? "bg-secondary hover:bg-secondary/80"
                                : "hover:bg-secondary/50"
                            )}
                          >
                            {loaded ? (
                              isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                            <span className="flex-1 truncate">{name}</span>
                            {loaded && (
                              <Badge variant={isSelected ? "outline" : "secondary"} className="text-xs">
                                {loaded.totalQuestions}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Datasets */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Bo du lieu da chon</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllDatasets} disabled={datasets.length === 0}>
                      Chon tat ca
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllDatasets} disabled={selectedDatasetIds.length === 0}>
                      Bo chon
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedDatasetIds.length} bo du lieu - {selectedQuestionCount} cau hoi chua choi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datasets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Chua co du lieu. Chon sheet tu danh sach ben trai.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2">
                      {datasets.map((dataset) => {
                        const isSelected = selectedDatasetIds.includes(dataset.id)
                        const unplayedCount = dataset.questions.filter(q => !q.played).length
                        return (
                          <div
                            key={dataset.id}
                            onClick={() => isSelected ? deselectDataset(dataset.id) : selectDataset(dataset.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox checked={isSelected} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{dataset.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {unplayedCount}/{dataset.totalQuestions} cau chua choi
                                </p>
                              </div>
                              <Badge variant={dataset.type === 1 ? "default" : "secondary"}>
                                {dataset.type === 1 ? "Ngu phap" : "Tu vung"}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={goToNextTab} disabled={selectedDatasetIds.length === 0}>
              Tiep theo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Player Selection */}
        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Nguoi choi ({players.length})
              </CardTitle>
              <CardDescription>Them nguoi choi de bat dau tro choi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Player */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ten nguoi choi..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
                  className="flex-1"
                />
                <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setBulkAddOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>

              {/* Player List */}
              {players.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Chua co nguoi choi. Them nguoi choi o tren.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={randomizePlayers}>
                      <Shuffle className="w-4 h-4 mr-1" /> Xao tron
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetPlayers}>
                      <Trash2 className="w-4 h-4 mr-1" /> Xoa het
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {players.map((player, index) => (
                        <div
                          key={player.id}
                          className="p-4 rounded-xl bg-secondary/50 border border-border/50 relative group"
                        >
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <p className="font-medium text-center truncate pt-1">{player.name}</p>
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6"
                              onClick={() => setEditingPlayer({ id: player.id, name: player.name })}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 text-destructive"
                              onClick={() => removePlayer(player.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={goToPrevTab}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Quay lai
            </Button>
            <Button onClick={goToNextTab} disabled={players.length === 0}>
              Tiep theo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Bulk Add Dialog */}
          <Dialog open={bulkAddOpen} onOpenChange={setBulkAddOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Them nhieu nguoi choi</DialogTitle>
                <DialogDescription>Moi dong la mot nguoi choi</DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Nguoi choi 1&#10;Nguoi choi 2&#10;Nguoi choi 3"
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                rows={8}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkAddOpen(false)}>Huy</Button>
                <Button onClick={handleBulkAdd} disabled={!bulkNames.trim()}>Them</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Player Dialog */}
          <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sua ten nguoi choi</DialogTitle>
                <DialogDescription>Nhap ten moi cho nguoi choi</DialogDescription>
              </DialogHeader>
              <Input
                value={editingPlayer?.name || ""}
                onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlayer(null)}>Huy</Button>
                <Button
                  onClick={() => {
                    if (editingPlayer) {
                      updatePlayer(editingPlayer.id, editingPlayer.name)
                      setEditingPlayer(null)
                      toast.success("Da cap nhat ten")
                    }
                  }}
                >
                  Luu
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 3: Game Mode & Start */}
        <TabsContent value="start" className="mt-6">
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">{selectedDatasetIds.length}</p>
                    <p className="text-sm text-muted-foreground">Bo du lieu</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">{selectedQuestionCount}</p>
                    <p className="text-sm text-muted-foreground">Cau hoi</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">{players.length}</p>
                    <p className="text-sm text-muted-foreground">Nguoi choi</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">{settings.boardColumns}</p>
                    <p className="text-sm text-muted-foreground">Cot bang</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Chon che do choi</CardTitle>
                <CardDescription>Moi che do co cach choi khac nhau</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gameModes.map((mode) => {
                    const Icon = mode.icon
                    const isSelected = selectedGameMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setGameMode(mode.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/30"
                        )}
                      >
                        <Icon className={cn("w-6 h-6 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <p className="font-medium text-sm">{mode.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Start Button */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={goToPrevTab}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lai
              </Button>
              <Button
                size="lg"
                onClick={onStartGame}
                disabled={!canStart}
                className="bg-gradient-fun hover:opacity-90 px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Bat dau choi!
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
