import { NextResponse } from "next/server"
import type { Dataset, Question } from "@/lib/types"
import { promises as fs } from 'fs'
import path from 'path'

// Hardcoded configuration
const SPREADSHEET_ID = "1D3CHYhGkmlsE1a10DgS6l_qyYU-L3Upeh5zgXWjDUJY"

// Fallback API keys in case file read fails
const FALLBACK_API_KEYS = [
  "AIzaSyC8uGxGFs3IK2mdOowQ8kokw1w5yNucZrM",
  "AIzaSyB7X_P9Bj5EzGeIAbzrsR9Y9o1cm7deYDE"
]

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

// Load API keys from JSON file
async function loadApiKeys(): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'apikey.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    if (data.apiKeys && Array.isArray(data.apiKeys) && data.apiKeys.length > 0) {
      return data.apiKeys
    }
  } catch (error) {
    console.error("Error loading API keys from file:", error)
  }
  return FALLBACK_API_KEYS
}

// Helper to delay for retry
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Make a request with API key fallback and retry for transient errors
async function fetchWithApiKeyFallback(
  urlTemplate: (apiKey: string) => string,
  apiKeys: string[],
  maxRetries: number = 3
): Promise<{ response: Response; usedApiKey: string } | { error: string; allFailed: true }> {
  let lastError = ""
  
  for (const apiKey of apiKeys) {
    const url = urlTemplate(apiKey)
    
    // Retry loop for transient errors (500, 503, etc.)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { cache: 'no-store' })
        
        if (response.ok) {
          return { response, usedApiKey: apiKey }
        }
        
        const errorText = await response.text()
        console.error(`Google Sheets API error (attempt ${attempt}/${maxRetries}):`, errorText)
        lastError = errorText
        
        // If it's a 500/503 error (transient), retry with exponential backoff
        if (response.status >= 500 && response.status < 600) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 500 // 1s, 2s, 4s
            console.log(`Retrying in ${waitTime}ms...`)
            await delay(waitTime)
            continue
          }
          // All retries exhausted for this key
          break
        }
        
        // If it's an API key error, try next key
        if (errorText.includes("API key not valid") || errorText.includes("API_KEY_INVALID")) {
          console.log(`API key failed: ${apiKey.substring(0, 10)}... trying next`)
          break // Move to next API key
        }
        
        // If it's a 404 error, the spreadsheet ID is wrong or not shared
        if (errorText.includes("NOT_FOUND") || errorText.includes("not found") || response.status === 404) {
          return { 
            error: `Google Sheet không tìm thấy. Hãy đảm bảo:\n1. Spreadsheet ID đúng: ${SPREADSHEET_ID}\n2. Google Sheet đã được chia sẻ công khai (Anyone with the link can view)`, 
            allFailed: true 
          }
        }
        
        // For other errors, break and try next key
        break
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt}/${maxRetries}):`, fetchError)
        lastError = String(fetchError)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 500
          await delay(waitTime)
          continue
        }
      }
    }
  }
  
  // If we get here, all keys failed
  if (lastError.includes("API key not valid") || lastError.includes("API_KEY_INVALID")) {
    return { error: "Tất cả API Key đều không hợp lệ. Vui lòng thêm API Key mới vào file public/data/apikey.json", allFailed: true }
  }
  
  if (lastError.includes("INTERNAL") || lastError.includes("500")) {
    return { error: "Google Sheets API đang gặp lỗi tạm thời. Vui lòng thử lại sau.", allFailed: true }
  }
  
  return { error: `Không thể kết nối Google Sheets: ${lastError}`, allFailed: true }
}

// GET - Fetch sheet names or sheet data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const sheetName = searchParams.get("sheetName") || searchParams.get("sheet")

  // Load API keys from JSON file
  const apiKeys = await loadApiKeys()

  try {
    // Action: getConfig - Return current configuration for debugging
    if (action === "getConfig") {
      return NextResponse.json({ 
        spreadsheetId: SPREADSHEET_ID,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
        apiKeyCount: apiKeys.length,
        message: "Hãy đảm bảo rằng Google Sheet đã được chia sẻ công khai (Anyone with the link can view)"
      })
    }

    // Action: getSheets - Fetch all sheet names from spreadsheet metadata
    if (action === "getSheets") {
      const result = await fetchWithApiKeyFallback(
        (apiKey) => `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${apiKey}&fields=sheets.properties.title`,
        apiKeys
      )
      
      if ('allFailed' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      const metadata = await result.response.json()
      const sheets = metadata.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || []

      return NextResponse.json({ sheets })
    }

    // Action: getSheetData - Fetch data from a specific sheet
    if (action === "getSheetData" && sheetName) {
      // Wrap sheet name in single quotes to handle names that look like cell references (e.g., TN0316)
      const safeSheetName = `'${sheetName}'`
      const result = await fetchWithApiKeyFallback(
        (apiKey) => `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(safeSheetName)}?key=${apiKey}`,
        apiKeys
      )
      
      if ('allFailed' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      const data = await result.response.json()
      const rows = data.values || []

      if (rows.length < 2) {
        return NextResponse.json({ 
          dataset: {
            id: generateId(),
            fileName: sheetName,
            createdAt: new Date().toISOString(),
            questions: [],
          }
        })
      }

      // Parse header to detect format
      const header = rows[0].map((h: string) => h?.toString().toLowerCase().trim())
      const dataRows = rows.slice(1)

      // Detect format: 
      // - New simple format (5 cols): type, question, answer, example, mapping
      // - Full format (8+ cols): type, question, answer1-4, correct, explain
      // - Old simple format (3 cols): type, question, answer
      const hasMapping = header.includes("mapping") || header.includes("example")
      const isFullFormat = header.includes("answer1") || header.includes("correct") || header.length >= 7

      let grammarCount = 0
      let vocabCount = 0

      const questions: Question[] = dataRows.map((row: string[], index: number) => {
        if (!row[0] || !row[1]) return null

        const typeStr = row[0]?.toString().trim()
        const type = (typeStr === '1' || typeStr.toLowerCase() === 'grammar') ? 1 : 2
        
        if (type === 1) grammarCount++
        else vocabCount++

        if (isFullFormat && row.length >= 7 && !hasMapping) {
          // Full format: type, question, answer1, answer2, answer3, answer4, correct, explain
          const question = row[1]?.trim() || ""
          const answers = [
            row[2]?.trim() || "", 
            row[3]?.trim() || "", 
            row[4]?.trim() || "", 
            row[5]?.trim() || ""
          ].filter(a => a)
          const correct = row[6]?.trim() || answers[0] || ""
          const explain = row[7]?.trim() || ""

          return {
            id: `${sheetName}-${index}-${generateId()}`,
            type: type as 1 | 2,
            question,
            answers: answers.length > 0 ? answers : [correct],
            correct,
            explain,
            example: "",
            mapping: "",
            played: false,
          }
        } else {
          // New simple format: type, question, answer, example, mapping
          // Or old simple format: type, question, answer
          const question = row[1]?.trim() || ""
          const answer = row[2]?.trim() || ""
          const example = row[3]?.trim() || ""
          const mapping = row[4]?.trim() || ""

          return {
            id: `${sheetName}-${index}-${generateId()}`,
            type: type as 1 | 2,
            question,
            answers: [answer],
            correct: answer,
            explain: "",
            example,
            mapping,
            played: false,
          }
        }
      }).filter((q): q is Question => q !== null && q.question !== "")

      const datasetType = grammarCount >= vocabCount ? 1 : 2

      return NextResponse.json({
        dataset: {
          id: `sheet-${sheetName}-${generateId()}`,
          fileName: sheetName,
          createdAt: new Date().toISOString(),
          type: datasetType as 1 | 2,
          totalQuestions: questions.length,
          questions,
        }
      })
    }

    // Default: fetch all sheets and their data
    const metadataResult = await fetchWithApiKeyFallback(
      (apiKey) => `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${apiKey}&fields=sheets.properties.title`,
      apiKeys
    )
    
    if ('allFailed' in metadataResult) {
      return NextResponse.json({ error: metadataResult.error }, { status: 400 })
    }

    const metadata = await metadataResult.response.json()
    const sheetNames = metadata.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || []

    // Fetch all sheets data
    const datasets: Dataset[] = []
    for (const name of sheetNames) {
      // Wrap sheet name in single quotes to handle names that look like cell references
      const safeName = `'${name}'`
      const dataResult = await fetchWithApiKeyFallback(
        (apiKey) => `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(safeName)}?key=${apiKey}`,
        apiKeys
      )

      if (!('allFailed' in dataResult)) {
        const data = await dataResult.response.json()
        const rows = data.values || []

        if (rows.length >= 2) {
          const header = rows[0].map((h: string) => h?.toString().toLowerCase().trim())
          const dataRows = rows.slice(1)
          const isFullFormat = header.includes("answer1") || header.includes("correct") || header.length >= 7

          let grammarCount = 0
          let vocabCount = 0

          const questions: Question[] = dataRows.map((row: string[], index: number) => {
            if (!row[0] || !row[1]) return null

            const typeStr = row[0]?.toString().trim()
            const type = (typeStr === '1' || typeStr.toLowerCase() === 'grammar') ? 1 : 2
            
            if (type === 1) grammarCount++
            else vocabCount++

            if (isFullFormat && row.length >= 7) {
              const question = row[1]?.trim() || ""
              const answers = [
                row[2]?.trim() || "", 
                row[3]?.trim() || "", 
                row[4]?.trim() || "", 
                row[5]?.trim() || ""
              ].filter(a => a)
              const correct = row[6]?.trim() || answers[0] || ""
              const explain = row[7]?.trim() || ""

              return {
                id: `${name}-${index}-${generateId()}`,
                type: type as 1 | 2,
                question,
                answers: answers.length > 0 ? answers : [correct],
                correct,
                explain,
                played: false,
              }
            } else {
              const question = row[1]?.trim() || ""
              const answer = row[2]?.trim() || ""

              return {
                id: `${name}-${index}-${generateId()}`,
                type: type as 1 | 2,
                question,
                answers: [answer],
                correct: answer,
                explain: "",
                played: false,
              }
            }
          }).filter((q): q is Question => q !== null && q.question !== "")

          if (questions.length > 0) {
            const datasetType = grammarCount >= vocabCount ? 1 : 2
            datasets.push({
              id: `sheet-${name}-${generateId()}`,
              fileName: name,
              createdAt: new Date().toISOString(),
              type: datasetType as 1 | 2,
              totalQuestions: questions.length,
              questions,
            })
          }
        }
      }
    }

    return NextResponse.json({ datasets, sheets: sheetNames })
  } catch (error) {
    console.error("Error fetching Google Sheets:", error)
    return NextResponse.json({ error: "Lỗi khi tải dữ liệu" }, { status: 500 })
  }
}
