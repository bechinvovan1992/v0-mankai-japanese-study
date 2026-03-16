import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "public", "data")

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// GET - Load all datasets from JSON files
export async function GET() {
  try {
    await ensureDataDir()
    
    const files = await fs.readdir(DATA_DIR)
    const jsonFiles = files.filter(f => f.endsWith(".json"))
    
    const datasets = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8")
        return JSON.parse(content)
      })
    )
    
    return NextResponse.json({ datasets })
  } catch (error) {
    console.error("Error loading datasets:", error)
    return NextResponse.json({ datasets: [] })
  }
}

// POST - Save a new dataset to JSON file
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()
    
    const dataset = await request.json()
    const fileName = `${dataset.id}.json`
    const filePath = path.join(DATA_DIR, fileName)
    
    await fs.writeFile(filePath, JSON.stringify(dataset, null, 2), "utf-8")
    
    return NextResponse.json({ success: true, fileName })
  } catch (error) {
    console.error("Error saving dataset:", error)
    return NextResponse.json({ success: false, error: "Failed to save dataset" }, { status: 500 })
  }
}

// DELETE - Remove a dataset JSON file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    }
    
    const filePath = path.join(DATA_DIR, `${id}.json`)
    
    try {
      await fs.unlink(filePath)
    } catch {
      // File might not exist, that's okay
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting dataset:", error)
    return NextResponse.json({ success: false, error: "Failed to delete dataset" }, { status: 500 })
  }
}
