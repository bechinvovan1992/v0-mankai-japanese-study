"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Users,
  Plus,
  Trash2,
  Shuffle,
  RotateCcw,
  Edit2,
  GripVertical,
  Sparkles,
  UserPlus,
  PartyPopper,
} from "lucide-react"
import { toast } from "sonner"

const playerColors = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-red-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-green-500 to-emerald-500",
]

export function PlayerManager() {
  const {
    players,
    addPlayer,
    updatePlayer,
    removePlayer,
    randomizePlayers,
    resetPlayers,
  } = useAppStore()

  const [bulkInput, setBulkInput] = useState("")
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ id: string; name: string } | null>(null)
  const [newName, setNewName] = useState("")

  const handleAddSingle = () => {
    if (!newName.trim()) {
      toast.error("Vui lòng nhập tên")
      return
    }
    if (players.length >= 20) {
      toast.error("Tối đa 20 người chơi")
      return
    }
    addPlayer(newName.trim())
    setNewName("")
    toast.success("Đã thêm người chơi!")
  }

  const handleBulkAdd = () => {
    const names = bulkInput
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (names.length === 0) {
      toast.error("Vui lòng nhập ít nhất một tên")
      return
    }

    const remaining = 20 - players.length
    const toAdd = names.slice(0, remaining)

    toAdd.forEach((name) => addPlayer(name))
    setBulkInput("")
    setShowBulkAdd(false)
    toast.success(`Đã thêm ${toAdd.length} người chơi!`)

    if (names.length > remaining) {
      toast.warning(`Chỉ thêm được ${remaining} người (tối đa 20)`)
    }
  }

  const handleEdit = () => {
    if (!editingPlayer || !editingPlayer.name.trim()) return
    updatePlayer(editingPlayer.id, editingPlayer.name.trim())
    setEditingPlayer(null)
    toast.success("Đã cập nhật!")
  }

  const handleDelete = (id: string) => {
    removePlayer(id)
    toast.success("Đã xóa người chơi")
  }

  const handleRandomize = () => {
    randomizePlayers()
    toast.success("Đã xáo trộn thứ tự!")
  }

  const handleReset = () => {
    resetPlayers()
    toast.success("Đã xóa tất cả người chơi")
  }

  return (
    <div className="space-y-6">
      {/* Add Player Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Thêm người chơi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên người chơi"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSingle()}
              disabled={players.length >= 20}
              className="text-lg"
            />
            <Button onClick={handleAddSingle} disabled={players.length >= 20} className="bg-gradient-fun hover:opacity-90 px-6">
              Thêm
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBulkAdd(true)}
            disabled={players.length >= 20}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhiều người chơi
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex -space-x-2">
              {[...Array(Math.min(5, players.length || 1))].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${playerColors[i % playerColors.length]} border-2 border-background`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">
              {players.length}/20 người chơi
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Player List */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Danh sách người chơi ({players.length})
            </CardTitle>
            {players.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRandomize} className="hover:bg-primary/10">
                  <Shuffle className="w-4 h-4 mr-1" />
                  Xáo trộn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Xóa hết
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">Chưa có người chơi</h3>
              <p className="text-muted-foreground">
                Thêm người chơi để bắt đầu trò chơi nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl group hover:bg-secondary transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${playerColors[index % playerColors.length]} flex items-center justify-center text-white font-bold shadow-md`}>
                    {index + 1}
                  </div>
                  <span className="flex-1 font-medium text-lg">{player.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPlayer({ id: player.id, name: player.name })}
                      className="hover:bg-primary/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(player.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Add Dialog */}
      <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              Thêm nhiều người chơi
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Nhập tên, mỗi tên một dòng:&#10;Người chơi 1&#10;Người chơi 2&#10;Người chơi 3"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={8}
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Mỗi tên một dòng. Có thể thêm tối đa {20 - players.length} người nữa.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAdd(false)}>
              Hủy
            </Button>
            <Button onClick={handleBulkAdd} className="bg-gradient-fun hover:opacity-90">
              Thêm người chơi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Sửa tên người chơi
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tên người chơi"
              value={editingPlayer?.name || ""}
              onChange={(e) =>
                setEditingPlayer((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              className="text-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Hủy
            </Button>
            <Button onClick={handleEdit} className="bg-gradient-fun hover:opacity-90">
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
