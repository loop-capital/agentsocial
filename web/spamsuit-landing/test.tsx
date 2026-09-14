'use client'

import { useState } from 'react'

export default function Test() {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [reporterPhone, setReporterPhone] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_body: 'Screenshot uploaded by user',
          screenshot_url: base64,
          source: 'web',
          reporter_phone: reporterPhone,
        })
      })
      const data = await res.json()
      if (data.success) {
        setUploadResult(`Report submitted! Case #${data.case_number}`)
      } else {
        setUploadResult('Error submitting report. Please try again.')
      }
    } catch (err) {
      setUploadResult('Error submitting report. Please try again.')
    }
    setUploading(false)
  };

  return (
    <main className="min-h-screen">
      <h1>Test</h1>
    </main>
  )
}