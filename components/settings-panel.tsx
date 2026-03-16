"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
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
  ExternalLink,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

export function SettingsPanel() {
  const { settings, updateSettings, resetAllData, loadDatasetsFromGoogleSheet, isLoadingFromGoogleSheet } = useAppStore()
  const [tempGoogleSheetUrl, setTempGoogleSheetUrl] = useState(settings.googleSheetUrl || "")

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ darkMode: checked })
    document.documentElement.classList.toggle("dark", checked)
    toast.success(`Đã bật chế độ ${checked ? "tối" : "sáng"}`)
  }

  const handleResetData = () => {
    resetAllData()
    toast.success("Đã xóa tất cả dữ liệu")
  }

  const handleSaveGoogleSheetUrl = async () => {
    updateSettings({ googleSheetUrl: tempGoogleSheetUrl })
    toast.success("Đã lưu liên kết Google Sheet")
    
    if (tempGoogleSheetUrl) {
      // Auto load data after saving
      await loadDatasetsFromGoogleSheet()
      toast.success("Đã tải dữ liệu từ Google Sheet")
    }
  }

  const handleRefreshGoogleSheet = async () => {
    if (!settings.googleSheetUrl) {
      toast.error("Vui lòng nhập liên kết Google Sheet trước")
      return
    }
    await loadDatasetsFromGoogleSheet()
    toast.success("Đã tải lại dữ liệu từ Google Sheet")
  }

  return (
    <div className="space-y-6">
      {/* Google Sheet Configuration */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileSpreadsheet className="w-5 h-5" />
            Cấu hình Google Sheet
          </CardTitle>
          <CardDescription>
            Kết nối với Google Sheet để tải dữ liệu câu hỏi tự động
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/50 rounded-xl space-y-4">
            <div>
              <Label className="text-base font-medium mb-2 block">Liên kết Google Sheet</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Dán liên kết Google Sheet đã được chia sẻ công khai. Mỗi sheet sẽ trở thành một bộ dữ liệu.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={tempGoogleSheetUrl}
                  onChange={(e) => setTempGoogleSheetUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveGoogleSheetUrl} disabled={isLoadingFromGoogleSheet}>
                  {isLoadingFromGoogleSheet ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {settings.googleSheetUrl && (
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">Đã kết nối Google Sheet</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(settings.googleSheetUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Mở
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshGoogleSheet}
                    disabled={isLoadingFromGoogleSheet}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingFromGoogleSheet ? "animate-spin" : ""}`} />
                    Tải lại
                  </Button>
                </div>
              </div>
            )}

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Định dạng dữ liệu:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Đầy đủ (8 cột):</strong> type | question | answer1 | answer2 | answer3 | answer4 | correct | explain</p>
                <p><strong>Đơn giản (3 cột):</strong> type | question | answer</p>
                <p className="mt-2"><em>type: 1 = Ngữ pháp, 2 = Từ vựng</em></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Giao diện
          </CardTitle>
          <CardDescription>
            Tùy chỉnh giao diện ứng dụng theo ý thích của bạn
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
                <Label className="text-base font-medium">Chế độ tối</Label>
                <p className="text-sm text-muted-foreground">
                  Bật/tắt giao diện tối
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
                <Label className="text-base font-medium">Hiệu ứng</Label>
                <p className="text-sm text-muted-foreground">
                  Bật/tắt hiệu ứng chuyển động
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
                <Label className="text-base font-medium">Âm thanh</Label>
                <p className="text-sm text-muted-foreground">
                  Bật/tắt hiệu ứng âm thanh
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
            Cài đặt trò chơi
          </CardTitle>
          <CardDescription>
            Tùy chỉnh bảng game và cách chơi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Board Columns */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Số cột bảng: {settings.boardColumns}</Label>
              <span className="text-sm text-muted-foreground">{settings.boardColumns} cột</span>
            </div>
            <Slider
              value={[settings.boardColumns]}
              onValueChange={([value]) => updateSettings({ boardColumns: value })}
              min={2}
              max={8}
              step={1}
            />
            <p className="text-sm text-muted-foreground mt-3">
              Số cột hiển thị trong bảng game (2-8 cột)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Cài đặt Flashcard
          </CardTitle>
          <CardDescription>
            Tùy chỉnh thời gian phát tự động
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Front Time */}
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Mặt trước</Label>
              <span className="text-sm text-muted-foreground">{settings.autoPlayFrontTime} giây</span>
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
              <Label className="text-base font-medium">Mặt sau</Label>
              <span className="text-sm text-muted-foreground">{settings.autoPlayBackTime} giây</span>
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
            Quản lý dữ liệu
          </CardTitle>
          <CardDescription>
            Xóa tất cả dữ liệu ứng dụng (không thể hoàn tác)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tất cả dữ liệu
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Thao tác này sẽ xóa tất cả bộ dữ liệu, người chơi, lịch sử chơi, và đặt lại tất cả cài đặt về mặc định. 
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xóa tất cả
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
