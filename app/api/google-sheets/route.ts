import { NextRequest, NextResponse } from "next/server"
import type { Dataset, Question } from "@/lib/types"

// Extract spreadsheet ID from various Google Sheets URL formats
function extractSpreadsheetId(url: string): string | null {
  // Handle /d/ID format
  const dMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (dMatch) return dMatch[1]
  
  // Handle key=ID format
  const keyMatch = url.match(/[?&]key=([a-zA-Z0-9-_]+)/)
  if (keyMatch) return keyMatch[1]
  
  // Handle direct ID (if just the ID is provided)
  if (/^[a-zA-Z0-9-_]+$/.test(url)) return url
  
  return null
}

// Get all sheet names from the spreadsheet
async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  // First, try to get the HTML version to extract sheet names
  const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  
  try {
    // Use the export feature to get sheet list
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      // If this fails, try fetching a default sheet and return just "Sheet1"
      return ["Sheet1"]
    }
    
    const text = await response.text()
    // The response is wrapped in google.visualization.Query.setResponse(...)
    // We just need to check if it's valid
    if (text.includes("table")) {
      return ["Sheet1"] // We'll try to get more sheets differently
    }
    
    return ["Sheet1"]
  } catch {
    return ["Sheet1"]
  }
}

// Fetch CSV data from a specific sheet
async function fetchSheetData(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${sheetName}`)
  }
  
  const csvText = await response.text()
  return parseCSV(csvText)
}

// Parse CSV text to 2D array
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const row: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    row.push(current.trim())
    rows.push(row)
  }
  
  return rows
}

// Convert sheet data to dataset
function convertToDataset(rows: string[][], sheetName: string): Dataset | null {
  if (rows.length < 2) return null // Need header + at least 1 data row
  
  const header = rows[0].map(h => h.toLowerCase().trim())
  const dataRows = rows.slice(1)
  
  // Detect format based on header
  const isFullFormat = header.includes('answer1') || header.includes('correct')
  const isSimpleFormat = header.includes('answer') && !header.includes('answer1')
  
  if (!isFullFormat && !isSimpleFormat) {
    // Try to detect by column count
    if (header.length >= 7) {
      // Assume full format: type, question, answer1-4, correct, explain
    } else if (header.length >= 3) {
      // Assume simple format: type, question, answer
    } else {
      return null
    }
  }
  
  const questions: Question[] = []
  let grammarCount = 0
  let vocabCount = 0
  
  for (const row of dataRows) {
    if (row.length < 3 || !row[0] || !row[1]) continue
    
    const typeStr = row[0].toString().trim()
    const type = typeStr === '1' || typeStr.toLowerCase() === 'grammar' ? 1 : 2
    
    if (type === 1) grammarCount++
    else vocabCount++
    
    const question = row[1]?.trim() || ''
    
    // Full format (8 columns): type, question, answer1, answer2, answer3, answer4, correct, explain
    if (row.length >= 7 && (isFullFormat || header.length >= 7)) {
      const answers = [
        row[2]?.trim() || '',
        row[3]?.trim() || '',
        row[4]?.trim() || '',
        row[5]?.trim() || ''
      ].filter(a => a !== '')
      
      const correct = row[6]?.trim() || answers[0] || ''
      const explain = row[7]?.trim() || ''
      
      questions.push({
        id: `${sheetName}-${questions.length + 1}`,
        type,
        question,
        answers: answers.length > 0 ? answers : [correct],
        correct,
        explain,
        played: false
      })
    }
    // Simple format (3 columns): type, question, answer
    else {
      const answer = row[2]?.trim() || ''
      
      questions.push({
        id: `${sheetName}-${questions.length + 1}`,
        type,
        question,
        answers: [answer],
        correct: answer,
        explain: '',
        played: false
      })
    }
  }
  
  if (questions.length === 0) return null
  
  // Determine dataset type based on majority
  const datasetType = grammarCount >= vocabCount ? 1 : 2
  
  return {
    id: `gsheet-${sheetName}-${Date.now()}`,
    fileName: sheetName,
    createdAt: new Date().toISOString(),
    type: datasetType as 1 | 2,
    totalQuestions: questions.length,
    questions
  }
}

// Try to get all sheet names by fetching spreadsheet metadata
async function getAllSheetNames(spreadsheetId: string): Promise<string[]> {
  try {
    // Try fetching multiple common sheet names
    const commonNames = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5', 
                         'Trang tính1', 'Trang tính2', 'Trang tính3',
                         'Data', 'Questions', 'Grammar', 'Vocabulary',
                         'Ngữ pháp', 'Từ vựng', 'Bài 1', 'Bài 2', 'Bài 3',
                         'Lesson1', 'Lesson2', 'Lesson3']
    
    const validSheets: string[] = []
    
    // First, try to get the actual sheet names from the HTML
    try {
      const metaUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`
      const response = await fetch(metaUrl, { 
        cache: 'no-store',
        headers: {
          'Accept': 'text/html'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        // Extract sheet names from the HTML (they're in the page)
        const sheetNameRegex = /"sheets":\[([^\]]+)\]/
        const match = html.match(sheetNameRegex)
        if (match) {
          const sheetsData = match[1]
          const nameMatches = sheetsData.matchAll(/"name":"([^"]+)"/g)
          for (const m of nameMatches) {
            validSheets.push(m[1])
          }
        }
      }
    } catch {
      // Ignore errors
    }
    
    // If we found sheets from HTML, use those
    if (validSheets.length > 0) {
      return validSheets
    }
    
    // Otherwise, try fetching common sheet names
    for (const name of commonNames) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
        const response = await fetch(url, { cache: 'no-store' })
        if (response.ok) {
          const text = await response.text()
          if (text.trim().length > 0) {
            validSheets.push(name)
          }
        }
      } catch {
        // Sheet doesn't exist, continue
      }
    }
    
    // If no sheets found, return default
    return validSheets.length > 0 ? validSheets : ['Sheet1']
  } catch {
    return ['Sheet1']
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }
  
  const spreadsheetId = extractSpreadsheetId(url)
  
  if (!spreadsheetId) {
    return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 })
  }
  
  try {
    // Get all sheet names
    const sheetNames = await getAllSheetNames(spreadsheetId)
    
    const datasets: Dataset[] = []
    
    // Fetch data from each sheet
    for (const sheetName of sheetNames) {
      try {
        const rows = await fetchSheetData(spreadsheetId, sheetName)
        const dataset = convertToDataset(rows, sheetName)
        if (dataset) {
          datasets.push(dataset)
        }
      } catch (error) {
        console.error(`Failed to fetch sheet ${sheetName}:`, error)
        // Continue with other sheets
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      datasets,
      sheetNames,
      spreadsheetId 
    })
  } catch (error) {
    console.error('Error fetching Google Sheet:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Google Sheet data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
