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
  Moon,
  Sun,
  Grid,
  Volume2,
  Clock,
  Trash2,
  Palette,
  Zap,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

export function SettingsPanel() {
  const { settings, updateSettings, resetAllData } = useAppStore()

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ darkMode: checked })
    document.documentElement.classList.toggle("dark", checked)
    toast.success(`Da bat che do ${checked ? "toi" : "sang"}`)
  }

  const handleResetData = () => {
    resetAllData()
    toast.success("Da xoa tat ca du lieu")
  }

  return (
    <div className="space-y-6">
      {/* Google Sheet Info - Hardcoded */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileSpreadsheet className="w-5 h-5" />
            Google Sheet
          </CardTitle>
          <CardDescription>
            Du lieu duoc tai tu Google Sheet da cau hinh san
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-success font-medium">Da ket noi Google Sheet</span>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Dinh dang du lieu:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Day du (8 cot):</strong> type | question | answer1 | answer2 | answer3 | answer4 | correct | explain</p>
              <p><strong>Don gian (3 cot):</strong> type | question | answer</p>
              <p className="mt-2"><em>type: 1 = Ngu phap, 2 = Tu vung</em></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Giao dien
          </CardTitle>
          <CardDescription>
            Tuy chinh giao dien ung dung theo y thich cua ban
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.darkMode ? "bg-indigo-500/20" : "bg-amber-500/20"}`}>
                {settings.darkMode ? (
                  <Moon className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div>
                <Label className="text-base font-medium">Che do toi</Label>
                <p className="text-sm text-muted-foreground">
                  Bat/tat giao dien toi
                </p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>

          {/* Animation */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-chart-1/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <Label className="text-base font-medium">Hieu ung</Label>
                <p className="text-sm text-muted-foreground">
                  Bat/tat hieu ung chuyen dong
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
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-chart-2/20 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <Label className="text-base font-medium">Am thanh</Label>
                <p className="text-sm text-muted-foreground">
                  Bat/tat hieu ung am thanh
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
            <Grid className="w-5 h-5 text-primary" />
            Cai dat tro choi
          </CardTitle>
          <CardDescription>
            Tuy chinh bang game va cach choi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Board Columns */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">So cot bang: {settings.boardColumns}</Label>
              <span className="text-sm text-muted-foreground">{settings.boardColumns} cot</span>
            </div>
            <Slider
              value={[settings.boardColumns]}
              onValueChange={([value]) => updateSettings({ boardColumns: value })}
              min={2}
              max={8}
              step={1}
            />
            <p className="text-sm text-muted-foreground mt-3">
              So cot hien thi trong bang game (2-8 cot)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Cai dat Flashcard
          </CardTitle>
          <CardDescription>
            Tuy chinh thoi gian phat tu dong
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Front Time */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Mat truoc</Label>
              <span className="text-sm text-muted-foreground">{settings.autoPlayFrontTime} giay</span>
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
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Mat sau</Label>
              <span className="text-sm text-muted-foreground">{settings.autoPlayBackTime} giay</span>
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
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Quan ly du lieu
          </CardTitle>
          <CardDescription>
            Xoa tat ca du lieu ung dung (khong the hoan tac)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Xoa tat ca du lieu
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ban co chac chan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thao tac nay se xoa tat ca bo du lieu, nguoi choi, lich su choi, va dat lai tat ca cai dat ve mac dinh. 
                  Hanh dong nay khong the hoan tac.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xoa tat ca
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
