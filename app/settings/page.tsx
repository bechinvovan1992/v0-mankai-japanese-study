"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { SettingsPanel } from "@/components/settings-panel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, KeyRound, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

const SETTINGS_PASSWORD = "1234554321"

export default function SettingsPage() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [attempts, setAttempts] = useState(0)

  const handleUnlock = () => {
    if (password === SETTINGS_PASSWORD) {
      setIsUnlocked(true)
      setPassword("")
      setAttempts(0)
      toast.success("Đã mở khóa cài đặt!")
    } else {
      setAttempts(prev => prev + 1)
      setPassword("")
      if (attempts >= 2) {
        toast.error("Sai mật khẩu! Vui lòng liên hệ quản trị viên.")
      } else {
        toast.error("Sai mật khẩu! Vui lòng thử lại.")
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-3 md:p-8">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Cài đặt</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Tùy chỉnh trải nghiệm học tập của bạn
            </p>
          </div>
          
          {isUnlocked ? (
            <SettingsPanel />
          ) : (
            <div className="flex items-center justify-center min-h-[50vh] md:min-h-[60vh]">
              <Card className="w-full max-w-md border-border/50 shadow-lg mx-2">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl">Nhập mật khẩu</CardTitle>
                  <CardDescription className="text-sm">
                    Vui lòng nhập mật khẩu để truy cập cài đặt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-12 text-base md:text-lg"
                      autoFocus
                    />
                  </div>
                  
                  {attempts > 0 && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Đã thử {attempts} lần. {attempts >= 3 ? "Vui lòng liên hệ quản trị viên." : `Còn ${3 - attempts} lần thử.`}</span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleUnlock} 
                    className="w-full h-12 text-base md:text-lg"
                    disabled={!password || attempts >= 5}
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Mở khóa
                  </Button>
                  
                  <p className="text-center text-xs md:text-sm text-muted-foreground">
                    Chỉ giáo viên hoặc quản trị viên mới có mật khẩu này
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
