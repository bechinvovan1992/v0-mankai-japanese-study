"use client"

import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  Moon,
  Sun,
  Grid,
  Sparkles,
  Volume2,
  Clock,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

export function SettingsPanel() {
  const { settings, updateSettings, resetAllData } = useAppStore()

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ darkMode: checked })
    document.documentElement.classList.toggle("dark", checked)
    toast.success(`${checked ? "Dark" : "Light"} mode enabled`)
  }

  const handleResetData = () => {
    resetAllData()
    toast.success("All data has been reset")
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle dark/light theme
                </p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>

          {/* Animation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <Label>Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable/disable UI animations
                </p>
              </div>
            </div>
            <Switch
              checked={settings.animationEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ animationEnabled: checked })
              }
            />
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Enable/disable sound effects
                </p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ soundEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Game Settings
          </CardTitle>
          <CardDescription>
            Configure game board and play options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Board Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Board Columns: {settings.boardColumns}</Label>
            </div>
            <Slider
              value={[settings.boardColumns]}
              onValueChange={([value]) => updateSettings({ boardColumns: value })}
              min={2}
              max={8}
              step={1}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Number of columns in the game board grid
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Flashcard Settings
          </CardTitle>
          <CardDescription>
            Configure auto-play timing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Front Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Front Side Time: {settings.autoPlayFrontTime}s</Label>
            </div>
            <Slider
              value={[settings.autoPlayFrontTime]}
              onValueChange={([value]) =>
                updateSettings({ autoPlayFrontTime: value })
              }
              min={1}
              max={15}
              step={1}
            />
          </div>

          {/* Back Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Back Side Time: {settings.autoPlayBackTime}s</Label>
            </div>
            <Slider
              value={[settings.autoPlayBackTime]}
              onValueChange={([value]) =>
                updateSettings({ autoPlayBackTime: value })
              }
              min={1}
              max={15}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Reset all app data (this cannot be undone)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all datasets, players, game history, and reset all settings to default.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
