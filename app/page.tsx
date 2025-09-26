"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, FileTextIcon, ArrowLeftIcon } from "@/components/icons"
import { PDFViewer } from "@/components/pdf-viewer"
import { ChatInterface } from "@/components/chat-interface"

export default function DocumentChatbot() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [selectedText, setSelectedText] = useState<string>("")
  const [selectedAction, setSelectedAction] = useState<"explain" | "ask" | "summarize" | undefined>()
  const [documentText, setDocumentText] = useState<string>("")

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  // Load PDF from localStorage on component mount
  useEffect(() => {
    const savedPdf = localStorage.getItem('currentPdf')
    const savedPdfName = localStorage.getItem('currentPdfName')
    const savedPdfSize = localStorage.getItem('currentPdfSize')
    
    if (savedPdfName) {
      console.log('[v0] Found saved PDF metadata:', savedPdfName, 'Size:', savedPdfSize)
      
      if (savedPdf) {
        // Try to load the full PDF data
        try {
          // Convert base64 back to ArrayBuffer safely
          const binaryString = atob(savedPdf)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const arrayBuffer = bytes.buffer
          
          // Create a File object
          const file = new File([arrayBuffer], savedPdfName, { type: 'application/pdf' })
          
          setUploadedFile(file)
          setPdfData(arrayBuffer)
          
          // Create object URL for display
          const url = URL.createObjectURL(file)
          setPdfUrl(url)
          
          console.log('[v0] PDF loaded from localStorage:', savedPdfName)
          console.log('[v0] PDF URL created:', url)
          console.log('[v0] File size:', file.size, 'bytes')
        } catch (error) {
          console.error('[v0] Failed to load PDF from localStorage:', error)
          // Clear corrupted data
          localStorage.removeItem('currentPdf')
          localStorage.removeItem('currentPdfName')
          localStorage.removeItem('currentPdfSize')
        }
      } else {
        // Only metadata available, show message
        console.log('[v0] Only PDF metadata available, file too large for localStorage')
        // You could show a message to re-upload the file
      }
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      // Check file size (limit to 10MB for localStorage)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('文件太大，请选择小于10MB的PDF文件')
        return
      }

      setUploadedFile(file)
      
      // Create object URL for display
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      
      console.log('[v0] PDF uploaded:', file.name)
      console.log('[v0] PDF URL created:', url)
      console.log('[v0] File size:', file.size, 'bytes')
      
      // Read file as ArrayBuffer for local processing
      const arrayBuffer = await file.arrayBuffer()
      setPdfData(arrayBuffer)
      
      // Save to localStorage for persistence (only if file is small enough)
      try {
        if (file.size <= 2 * 1024 * 1024) { // Only save files under 2MB to localStorage
          // Use a safer method to convert ArrayBuffer to base64
          const uint8Array = new Uint8Array(arrayBuffer)
          let binaryString = ''
          const chunkSize = 8192 // Process in chunks to avoid stack overflow
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize)
            binaryString += String.fromCharCode.apply(null, Array.from(chunk))
          }
          
          const base64 = btoa(binaryString)
          localStorage.setItem('currentPdf', base64)
          localStorage.setItem('currentPdfName', file.name)
          localStorage.setItem('currentPdfSize', file.size.toString())
          console.log('[v0] PDF saved to localStorage:', file.name, 'Size:', file.size)
        } else {
          // For larger files, just save metadata
          localStorage.setItem('currentPdfName', file.name)
          localStorage.setItem('currentPdfSize', file.size.toString())
          localStorage.removeItem('currentPdf') // Remove old data
          console.log('[v0] Large PDF - only metadata saved to localStorage')
        }
      } catch (error) {
        console.error('[v0] Failed to save PDF to localStorage:', error)
        // Clear any partial data
        localStorage.removeItem('currentPdf')
        localStorage.removeItem('currentPdfName')
        localStorage.removeItem('currentPdfSize')
      }
    } else {
      alert('请选择PDF文件')
    }
  }

  const handleTextSelected = (text: string, action: "explain" | "ask" | "summarize") => {
    setSelectedText(text)
    setSelectedAction(action)
    // Clear after a short delay to allow chat component to process
    setTimeout(() => {
      setSelectedText("")
      setSelectedAction(undefined)
    }, 100)
  }

  const handleDocumentTextExtracted = (text: string) => {
    setDocumentText(text)
    console.log('[v0] Document text extracted and stored:', text.length, 'characters')
  }

  const handleBackToUpload = () => {
    // Clean up current file
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
    }
    
    // Clear state
    setUploadedFile(null)
    setPdfUrl(null)
    setPdfData(null)
    setSelectedText("")
    setSelectedAction(undefined)
    
    // Clear localStorage
    localStorage.removeItem('currentPdf')
    localStorage.removeItem('currentPdfName')
    localStorage.removeItem('currentPdfSize')
    
    console.log('[v0] Returned to upload page')
  }

  if (!uploadedFile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          {/* Minimal Logo */}
          <div className="mb-12">
            <div className="w-16 h-16 mx-auto bg-black rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <FileTextIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-light text-black mb-3 tracking-tight">Document Assistant</h1>
            <p className="text-gray-600 text-lg font-light">
              AI-powered PDF analysis
            </p>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-black hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-black transition-colors duration-200">
                    <UploadIcon className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</p>
                  <p className="text-sm text-gray-500">Drag and drop or click to browse</p>
                </div>
              </div>
            </label>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-gray-700">Text Extraction</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-gray-700">AI Analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-gray-700">Smart Chat</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm text-gray-700">Translation</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBackToUpload}
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg px-3 py-2"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <FileTextIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-medium text-black text-sm">{uploadedFile.name}</h2>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span className="text-xs text-gray-500 font-medium">Ready</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* PDF Viewer - Left Side */}
        <div className="flex-1 border-r border-gray-200">
          <PDFViewer 
            pdfUrl={pdfUrl!} 
            fileName={uploadedFile.name} 
            onTextSelected={handleTextSelected}
            onDocumentTextExtracted={handleDocumentTextExtracted}
          />
        </div>

        {/* Chat Interface - Right Side */}
        <div className="w-80 bg-white border-l border-gray-200">
          <ChatInterface 
            fileName={uploadedFile.name} 
            selectedText={selectedText} 
            selectedAction={selectedAction}
            documentText={documentText}
          />
        </div>
      </div>
    </div>
  )
}
