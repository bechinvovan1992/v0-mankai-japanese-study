"use client"

import { Navigation } from "@/components/navigation"
import { DatasetManager } from "@/components/dataset-manager"

export default function DatasetsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Quản lý bộ dữ liệu</h1>
            <p className="text-muted-foreground">
              Xem, chọn và quản lý các bộ câu hỏi của bạn
            </p>
          </div>
          <DatasetManager />
        </div>
      </main>
    </div>
  )
}
