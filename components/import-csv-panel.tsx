"use client"

import { useState, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import type { Dataset, Question } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Upload, FileText, Check, AlertCircle, X } from "lucide-react"
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
        errors.push("Type must be 1 (grammar) or 2 (vocabulary)")
      }
      if (!question) {
        errors.push("Question is required")
      }
      if (!answer1 || !answer2 || !answer3 || !answer4) {
        errors.push("All 4 answers are required")
      }
      if (!["answer1", "answer2", "answer3", "answer4"].includes(correct)) {
        errors.push("Correct must be answer1, answer2, answer3, or answer4")
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
      toast.error("Failed to read file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    const validQuestions = parsedData.filter((q) => q.valid)
    if (validQuestions.length === 0) {
      toast.error("No valid questions to import")
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
    toast.success(`Imported ${questions.length} questions successfully!`)
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
              <Upload className="w-5 h-5" />
              Import CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
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
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Click to upload CSV file</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">CSV Format</h4>
              <code className="text-xs text-muted-foreground block">
                type,question,answer1,answer2,answer3,answer4,correct,explain
              </code>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>type:</strong> 1 = grammar, 2 = vocabulary
                </p>
                <p>
                  <strong>correct:</strong> answer1, answer2, answer3, or answer4
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
                <span>Preview Data</span>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label>Dataset Type</Label>
                <Select value={datasetType} onValueChange={(v) => setDatasetType(v as "1" | "2")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Grammar</SelectItem>
                    <SelectItem value="2">Vocabulary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead className="w-24">Status</TableHead>
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
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Invalid</Badge>
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
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={validCount === 0}>
                  Import {validCount} Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "success" && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Import Successful!</h3>
            <p className="text-muted-foreground mb-6">
              {validCount} questions have been added to your dataset.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={resetForm}>
                Import More
              </Button>
              <Button asChild>
                <a href="/datasets">View Datasets</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
