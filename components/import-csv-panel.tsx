"use client"

import { useState, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import type { Dataset, Question } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Check, AlertCircle, X, Sparkles, PartyPopper } from "lucide-react"
import { toast } from "sonner"

interface ParsedQuestion {
  type: number
  question: string
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  correct: string
  explain: string
  valid: boolean
  errors: string[]
}

export function ImportCsvPanel() {
  const { addDataset } = useAppStore()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([])
  const [datasetType, setDatasetType] = useState<"1" | "2">("1")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload")

  const parseCSV = useCallback((text: string): ParsedQuestion[] => {
    const lines = text.trim().split("\n")
    const results: ParsedQuestion[] = []

    // Skip header if exists
    const startIndex = lines[0]?.toLowerCase().includes("type") ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parse CSV line handling quoted values
      const values: string[] = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const errors: string[] = []
      const type = parseInt(values[0]) || 0
      const question = values[1] || ""
      const answer1 = values[2] || ""
      const answer2 = values[3] || ""
      const answer3 = values[4] || ""
      const answer4 = values[5] || ""
      const correct = values[6] || ""
      const explain = values[7] || ""

      // Validation
      if (type !== 1 && type !== 2) {
        errors.push("Loại phải là 1 (ngữ pháp) hoặc 2 (từ vựng)")
      }
      if (!question) {
        errors.push("Câu hỏi là bắt buộc")
      }
      if (!answer1 || !answer2 || !answer3 || !answer4) {
        errors.push("Cần có đủ 4 đáp án")
      }
      if (!["answer1", "answer2", "answer3", "answer4"].includes(correct)) {
        errors.push("Đáp án đúng phải là answer1, answer2, answer3, hoặc answer4")
      }

      results.push({
        type,
        question,
        answer1,
        answer2,
        answer3,
        answer4,
        correct,
        explain,
        valid: errors.length === 0,
        errors,
      })
    }

    return results
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)

    try {
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      setParsedData(parsed)
      setStep("preview")
    } catch {
      toast.error("Không thể đọc file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    const validQuestions = parsedData.filter((q) => q.valid)
    if (validQuestions.length === 0) {
      toast.error("Không có câu hỏi hợp lệ để nhập")
      return
    }

    const now = new Date()
    const fileName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.json`

    const questions: Question[] = validQuestions.map((q, index) => ({
      id: `${Date.now()}-${index}`,
      type: (parseInt(datasetType) as 1 | 2) || (q.type as 1 | 2),
      question: q.question,
      answers: [q.answer1, q.answer2, q.answer3, q.answer4],
      correct: q[q.correct as keyof ParsedQuestion] as string,
      explain: q.explain,
      played: false,
    }))

    const dataset: Dataset = {
      id: `dataset-${Date.now()}`,
      fileName,
      createdAt: now.toISOString(),
      type: parseInt(datasetType) as 1 | 2,
      totalQuestions: questions.length,
      questions,
    }

    addDataset(dataset)
    toast.success(`Đã nhập ${questions.length} câu hỏi thành công!`)
    setStep("success")
  }

  const resetForm = () => {
    setFile(null)
    setParsedData([])
    setStep("upload")
  }

  const validCount = parsedData.filter((q) => q.valid).length
  const invalidCount = parsedData.filter((q) => !q.valid).length

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Nhập File CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center bg-primary/5 hover:bg-primary/10 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-fun flex items-center justify-center shadow-lg animate-bounce-soft">
                  <FileText className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">Nhấn để tải file CSV lên</p>
                  <p className="text-sm text-muted-foreground">
                    hoặc kéo thả file vào đây
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-secondary/50 rounded-xl p-5">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Định dạng CSV
              </h4>
              <code className="text-xs text-muted-foreground block bg-background/50 p-3 rounded-lg">
                type,question,answer1,answer2,answer3,answer4,correct,explain
              </code>
              <div className="mt-4 text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">type:</strong> 1 = ngữ pháp, 2 = từ vựng
                </p>
                <p>
                  <strong className="text-foreground">correct:</strong> answer1, answer2, answer3, hoặc answer4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Xem trước dữ liệu
                </span>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" />
                  Hủy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    {validCount} hợp lệ
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {invalidCount} lỗi
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label>Loại bộ dữ liệu</Label>
                <Select value={datasetType} onValueChange={(v) => setDatasetType(v as "1" | "2")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ngữ pháp</SelectItem>
                    <SelectItem value="2">Từ vựng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Câu hỏi</TableHead>
                        <TableHead>Đáp án đúng</TableHead>
                        <TableHead className="w-24">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.question}
                          </TableCell>
                          <TableCell>
                            {item[item.correct as keyof ParsedQuestion] as string}
                          </TableCell>
                          <TableCell>
                            {item.valid ? (
                              <Badge variant="outline" className="text-success border-success">
                                OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Lỗi</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button onClick={handleImport} disabled={validCount === 0} className="bg-gradient-fun hover:opacity-90">
                  Nhập {validCount} câu hỏi
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "success" && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-success flex items-center justify-center mx-auto mb-4 shadow-lg">
              <PartyPopper className="w-10 h-10 text-success-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Nhập thành công!</h3>
            <p className="text-muted-foreground mb-6">
              Đã thêm {validCount} câu hỏi vào bộ dữ liệu của bạn.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={resetForm}>
                Nhập thêm
              </Button>
              <Button asChild className="bg-gradient-fun hover:opacity-90">
                <a href="/datasets">Xem bộ dữ liệu</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
