'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAdRecord } from '@/app/actions/uploadAction'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, UploadCloud, Loader2 } from 'lucide-react'

export default function UploadAdDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [targetPanel, setTargetPanel] = useState<'FRONT' | 'LEFT' | 'RIGHT' | 'ANY'>('ANY')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    setLoading(true)
    setError(null)

    try {
      // 1. Upload file to Supabase Storage bucket named 'ads'
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ads')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload to Supabase Storage')
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ads')
        .getPublicUrl(filePath)

      // 3. Determine Media Type
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'

      // 4. Save to Database via Server Action
      const result = await createAdRecord(title, publicUrl, mediaType, targetPanel)

      if (result.error) {
        throw new Error(result.error)
      }

      // Reset and close
      setTitle('')
      setFile(null)
      setTargetPanel('ANY')
      setOpen(false)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Ad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Advertisement</DialogTitle>
          <DialogDescription>
            Upload a creative asset to the AdBox fleet library. Must be JPG, PNG, or MP4.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Ad Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Summer Coca-Cola Campaign" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel">Target Panel</Label>
            <select 
              id="panel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={targetPanel}
              onChange={(e) => setTargetPanel(e.target.value as any)}
            >
              <option value="ANY">Any Panel</option>
              <option value="FRONT">Front Panel Only</option>
              <option value="LEFT">Left Panel Only</option>
              <option value="RIGHT">Right Panel Only</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Creative Asset</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 mb-2 text-slate-400" />
              {file ? (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
              ) : (
                <span className="text-sm">Click or drag file to upload</span>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/mp4" 
                onChange={handleFileChange} 
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading || !file || !title}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save Advertisement'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
