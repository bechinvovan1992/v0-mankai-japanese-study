import { NextResponse } from "next/server"
import type { Dataset, Question } from "@/lib/types"

// Hardcoded configuration
// Note: The spreadsheet must be publicly shared (Anyone with the link can view)
// The SPREADSHEET_ID is extracted from your Google Sheet URL:
// https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
const SPREADSHEET_ID = "1D3CHYhGkmlsE1a10DgS6l_qyYU-L3Upeh5zgXWjDUJY"
const DEFAULT_API_KEY = "AIzaSyC8uGxGFs3IK2mdOowQ8kokw1w5yNucZrM"

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

// GET - Fetch sheet names or sheet data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const sheetName = searchParams.get("sheetName") || searchParams.get("sheet")
  const apiKeyParam = searchParams.get("apiKey")
  
  // Use provided API key or fall back to default
  const API_KEY = apiKeyParam || DEFAULT_API_KEY

  try {
    // Action: getConfig - Return current configuration for debugging
    if (action === "getConfig") {
      return NextResponse.json({ 
        spreadsheetId: SPREADSHEET_ID,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
        message: "Hay dam bao rang Google Sheet da duoc chia se cong khai (Anyone with the link can view)"
      })
    }

    // Action: getSheets - Fetch all sheet names from spreadsheet metadata
    if (action === "getSheets") {
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}&fields=sheets.properties.title`
      const metadataRes = await fetch(metadataUrl, { cache: 'no-store' })
      
      if (!metadataRes.ok) {
        const errorText = await metadataRes.text()
        console.error("Google Sheets API error:", errorText)
        
        // Check for API key error
        if (errorText.includes("API key not valid") || errorText.includes("API_KEY_INVALID")) {
          return NextResponse.json({ 
            error: "API Key khong hop le. Vui long cap nhat API Key moi trong Cai dat.", 
            details: errorText 
          }, { status: 400 })
        }
        
        // Check for not found error
        if (errorText.includes("not found") || metadataRes.status === 404) {
          return NextResponse.json({ 
            error: "Khong tim thay Google Sheet. Kiem tra lai Spreadsheet ID.", 
            details: errorText 
          }, { status: 404 })
        }
        
        return NextResponse.json({ error: "Khong the tai danh sach sheet", details: errorText }, { status: 500 })
      }

      const metadata = await metadataRes.json()
      const sheets = metadata.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || []

      return NextResponse.json({ sheets })
    }

    // Action: getSheetData - Fetch data from a specific sheet
    if (action === "getSheetData" && sheetName) {
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
      const dataRes = await fetch(dataUrl, { cache: 'no-store' })

      if (!dataRes.ok) {
        const errorText = await dataRes.text()
        console.error("Google Sheets API error:", errorText)
        
        if (errorText.includes("API key not valid") || errorText.includes("API_KEY_INVALID")) {
          return NextResponse.json({ 
            error: "API Key khong hop le. Vui long cap nhat API Key moi trong Cai dat.", 
            details: errorText 
          }, { status: 400 })
        }
        
        return NextResponse.json({ error: "Khong the tai du lieu sheet", details: errorText }, { status: 500 })
      }

      const data = await dataRes.json()
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

      // Detect format: full (8 cols) or simple (3 cols)
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
            played: false,
          }
        } else {
          // Simple format: type, question, answer
          const question = row[1]?.trim() || ""
          const answer = row[2]?.trim() || ""

          return {
            id: `${sheetName}-${index}-${generateId()}`,
            type: type as 1 | 2,
            question,
            answers: [answer],
            correct: answer,
            explain: "",
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
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}&fields=sheets.properties.title`
    const metadataRes = await fetch(metadataUrl, { cache: 'no-store' })

    if (!metadataRes.ok) {
      return NextResponse.json({ error: "Khong the tai spreadsheet" }, { status: 500 })
    }

    const metadata = await metadataRes.json()
    const sheetNames = metadata.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || []

    // Fetch all sheets data
    const datasets: Dataset[] = []
    for (const name of sheetNames) {
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(name)}?key=${API_KEY}`
      const dataRes = await fetch(dataUrl, { cache: 'no-store' })

      if (dataRes.ok) {
        const data = await dataRes.json()
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
    return NextResponse.json({ error: "Loi khi tai du lieu" }, { status: 500 })
  }
}
