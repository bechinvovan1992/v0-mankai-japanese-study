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
} from "lucide-react"
import { toast } from "sonner"

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
      toast.error("Please enter a name")
      return
    }
    if (players.length >= 20) {
      toast.error("Maximum 20 players allowed")
      return
    }
    addPlayer(newName.trim())
    setNewName("")
    toast.success("Player added")
  }

  const handleBulkAdd = () => {
    const names = bulkInput
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (names.length === 0) {
      toast.error("Please enter at least one name")
      return
    }

    const remaining = 20 - players.length
    const toAdd = names.slice(0, remaining)

    toAdd.forEach((name) => addPlayer(name))
    setBulkInput("")
    setShowBulkAdd(false)
    toast.success(`Added ${toAdd.length} player(s)`)

    if (names.length > remaining) {
      toast.warning(`Only added ${remaining} players (max 20)`)
    }
  }

  const handleEdit = () => {
    if (!editingPlayer || !editingPlayer.name.trim()) return
    updatePlayer(editingPlayer.id, editingPlayer.name.trim())
    setEditingPlayer(null)
    toast.success("Player updated")
  }

  const handleDelete = (id: string) => {
    removePlayer(id)
    toast.success("Player removed")
  }

  const handleRandomize = () => {
    randomizePlayers()
    toast.success("Players shuffled")
  }

  const handleReset = () => {
    resetPlayers()
    toast.success("All players cleared")
  }

  return (
    <div className="space-y-6">
      {/* Add Player Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter player name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSingle()}
              disabled={players.length >= 20}
            />
            <Button onClick={handleAddSingle} disabled={players.length >= 20}>
              Add
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBulkAdd(true)}
            disabled={players.length >= 20}
            className="w-full"
          >
            Add Multiple Players
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {players.length}/20 players
          </p>
        </CardContent>
      </Card>

      {/* Player List */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({players.length})
            </CardTitle>
            {players.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRandomize}>
                  <Shuffle className="w-4 h-4 mr-1" />
                  Shuffle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-destructive hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No players added yet. Add players to start a game.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium">{player.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPlayer({ id: player.id, name: player.name })}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(player.id)}
                      className="text-destructive hover:text-destructive"
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
            <DialogTitle>Add Multiple Players</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter names, one per line:&#10;Player 1&#10;Player 2&#10;Player 3"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={8}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Enter one name per line. Maximum {20 - players.length} more players can be added.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAdd}>Add Players</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Player name"
              value={editingPlayer?.name || ""}
              onChange={(e) =>
                setEditingPlayer((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
