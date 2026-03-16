"use client"

import { Navigation } from "@/components/navigation"
import { ImportCsvPanel } from "@/components/import-csv-panel"

export default function ImportPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Import CSV</h1>
            <p className="text-muted-foreground">
              Import question data from CSV files
            </p>
          </div>
          <ImportCsvPanel />
        </div>
      </main>
    </div>
  )
}
