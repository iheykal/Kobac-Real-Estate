'use client'

import { useState } from 'react'
import { uploadPropertyImagesToR2 } from '@/lib/r2-upload'

export default function TestAgentUpload() {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setThumbnailFile(file)
    console.log('📸 Thumbnail selected:', file?.name)
  }

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAdditionalFiles(files)
    console.log('📸 Additional files selected:', files.map(f => f.name))
  }

  const handleTest = async () => {
    if (!thumbnailFile || additionalFiles.length === 0) {
      alert('Please select both thumbnail and additional images')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      console.log('🚀 Starting agent upload simulation...')
      
      // Simulate the agent upload logic
      const allImages: File[] = []
      const addedFiles = new Set<string>()
      
      // Add thumbnail
      if (thumbnailFile) {
        allImages.push(thumbnailFile)
        addedFiles.add(thumbnailFile.name)
      }
      
      // Add additional images, skipping duplicates
      additionalFiles.forEach(file => {
        if (!addedFiles.has(file.name)) {
          allImages.push(file)
          addedFiles.add(file.name)
        } else {
          console.log('🔄 Skipping duplicate file:', file.name)
        }
      })
      
      console.log('📸 Files to upload:', {
        thumbnail: thumbnailFile.name,
        additional: additionalFiles.map(f => f.name),
        totalFiles: allImages.length,
        allFiles: allImages.map(f => f.name)
      })
      
      // Upload images
      const uploadResults = await uploadPropertyImagesToR2(allImages, 'test-property-id')
      const imageUrls = uploadResults.map(result => result.url)
      
      console.log('📸 Upload results:', {
        uploadResults,
        imageUrls
      })
      
      // Simulate the database update logic
      const updatePayload = {
        thumbnailImage: imageUrls[0],
        images: imageUrls.slice(1)
      }
      
      console.log('🔄 Update payload:', updatePayload)
      
      setResults({
        success: true,
        originalFiles: {
          thumbnail: thumbnailFile.name,
          additional: additionalFiles.map(f => f.name)
        },
        uploadedFiles: allImages.map(f => f.name),
        uploadResults,
        imageUrls,
        updatePayload,
        analysis: {
          totalUploaded: imageUrls.length,
          thumbnailUrl: imageUrls[0],
          additionalUrls: imageUrls.slice(1),
          additionalCount: imageUrls.slice(1).length
        }
      })
    } catch (error) {
      console.error('❌ Test failed:', error)
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Agent Upload Test</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Images</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Thumbnail Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="mb-2"
            />
            {thumbnailFile && (
              <p className="text-sm text-green-600">✅ {thumbnailFile.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Additional Images:</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleAdditionalChange}
              className="mb-2"
            />
            {additionalFiles.length > 0 && (
              <div>
                <p className="text-sm text-green-600 mb-1">✅ {additionalFiles.length} files selected:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {additionalFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button
            onClick={handleTest}
            disabled={loading || !thumbnailFile || additionalFiles.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Upload Logic'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

