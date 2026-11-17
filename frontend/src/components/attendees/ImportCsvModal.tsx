import React, { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { importAttendeesCSV, type AttendeeCSVImportResultData } from '@/lib/api'

interface ImportCsvModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onSuccess: () => void
}

export function ImportCsvModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: ImportCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AttendeeCSVImportResultData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDownloadTemplate = () => {
    const csvContent =
      'name,email,role,dietary_preferences,notes\n' +
      'Sarah Connor,sarah@example.com,Speaker,Vegetarian,Keynote speaker on AI\n' +
      'John Doe,john.doe@example.com,Guest,Nut Allergy,VIP Guest\n' +
      'Alex Rivera,alex.r@example.com,Volunteer,None,Assisting registration desk'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'event_pro_attendees_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.name.endsWith('.csv')) {
        setErrorMsg('Please select a valid .csv file.')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      setErrorMsg(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a CSV file to upload.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await importAttendeesCSV(eventId, selectedFile)
      setResult(res)
      onSuccess()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import CSV.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setResult(null)
    setErrorMsg(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
          <h2 className="text-base font-bold text-[hsl(var(--foreground))]">
            Bulk Import Attendees from CSV
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--destructive)/0.08)] p-3 text-xs text-[hsl(var(--destructive))]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success summary */}
          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 text-emerald-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Import Completed Successfully!</span>
              </div>
              <p className="mt-2 text-xs">
                Processed <strong>{result.total_processed}</strong> rows:
                <br />
                • <strong>{result.imported}</strong> new attendees added to the roster
                <br />
                • <strong>{result.skipped}</strong> rows skipped (duplicate emails or missing fields)
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-amber-700">
                  <p className="font-semibold">Notes:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-[hsl(var(--foreground))]">CSV Format Requirements</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Required columns: <code className="font-mono text-[hsl(var(--primary))] font-bold">name</code>,{' '}
                  <code className="font-mono text-[hsl(var(--primary))] font-bold">email</code>
                  <br />
                  Optional: <code className="font-mono">role</code>, <code className="font-mono">dietary_preferences</code>,{' '}
                  <code className="font-mono">notes</code>
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Template</span>
              </Button>
            </div>
          </div>

          {/* File Picker Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] p-6 text-center transition hover:border-[hsl(var(--primary))]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
                <FileText className="h-5 w-5" />
                <span>{selectedFile.name}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  ({Math.round(selectedFile.size / 1024)} KB)
                </span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                <p className="mt-2 text-xs font-semibold text-[hsl(var(--foreground))]">
                  Click to browse or drop your CSV file here
                </p>
                <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                  Only .csv files are supported
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-[hsl(var(--border))] pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                <span>{isLoading ? 'Importing…' : 'Import Roster'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
