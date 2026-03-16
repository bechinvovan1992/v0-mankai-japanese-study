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
  Key,
  Save,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"

export function SettingsPanel() {
  const { settings, updateSettings, resetAllData } = useAppStore()
  const [apiKeyInput, setApiKeyInput] = useState(settings.googleApiKey || "")
  const [showApiKey, setShowApiKey] = useState(false)

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ darkMode: checked })
    document.documentElement.classList.toggle("dark", checked)
    toast.success(`Đã bật chế độ ${checked ? "tối" : "sáng"}`)
  }

  const handleSaveApiKey = () => {
    updateSettings({ googleApiKey: apiKeyInput })
    toast.success("Đã lưu API Key")
  }

  const handleResetData = () => {
    resetAllData()
    toast.success("Đã xóa tất cả dữ liệu")
  }

  return (
    <div className="space-y-6">
      {/* API Key Configuration */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="w-5 h-5" />
            Google API Key
          </CardTitle>
          <CardDescription>
            Cấu hình API Key để kết nối với Google Sheets. Thay đổi nếu API Key cũ hết hiệu lực.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Nhập Google API Key..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={handleSaveApiKey} disabled={!apiKeyInput || !apiKeyInput.trim()}>
              <Save className="w-4 h-4 mr-1" />
              Lưu
            </Button>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Hướng dẫn lấy API Key:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Truy cập Google Cloud Console</li>
              <li>Tạo project mới hoặc chọn project hiện có</li>
              <li>Bật Google Sheets API</li>
              <li>Tạo API Key và dán vào đây</li>
            </ol>
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
            Cài đặt Ôn tập
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
