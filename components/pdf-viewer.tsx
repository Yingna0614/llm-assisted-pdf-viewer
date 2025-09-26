"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  MessageSquareIcon,
  HelpCircleIcon,
  FileTextIcon,
} from "@/components/icons"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

interface PDFViewerProps {
  pdfUrl: string
  fileName: string
  onTextSelected: (text: string, action: "explain" | "ask" | "summarize") => void
  onDocumentTextExtracted?: (text: string) => void
}

export function PDFViewer({ pdfUrl, fileName, onTextSelected, onDocumentTextExtracted }: PDFViewerProps) {
  const [selectedText, setSelectedText] = useState("")
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [manualText, setManualText] = useState("")
  const [showTextOptions, setShowTextOptions] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [showTextView, setShowTextView] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true)
      setError(null)

      // Immediately stop loading since we have a URL
      setTimeout(() => {
        setIsLoading(false)
        console.log("[v0] PDF URL ready, stopping loading")
      }, 100) // Very short delay to show loading briefly

      // Set a timeout to handle loading issues
      const loadingTimeout = setTimeout(() => {
        console.log("[v0] PDF loading timeout, trying alternative approach")
        setIsLoading(false)
      }, 3000) // 3 second timeout

      return () => clearTimeout(loadingTimeout)
    }
  }, [pdfUrl])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      setSelectedText(text)
      console.log("[v0] Selected text:", text)
    } else {
      setSelectedText("")
    }
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    handleTextSelection()
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    if (selectedText) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY })
      setShowContextMenu(true)
    }
  }

  const handleContextMenuAction = (action: "explain" | "ask" | "summarize") => {
    if (selectedText) {
      onTextSelected(selectedText, action)
      setSelectedText("")
      setShowContextMenu(false)
      setContextMenuPosition(null)
    }
  }

  const handleManualTextAction = (action: "explain" | "ask" | "summarize") => {
    if (manualText.trim()) {
      onTextSelected(manualText.trim(), action)
      setManualText("")
      setShowTextInput(false)
    }
  }

  const handleExtractText = async () => {
    try {
      setIsExtracting(true)
      setExtractedText("正在提取PDF文本...")
      
      // 使用PDF.js从CDN加载
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = async () => {
        try {
          // 设置PDF.js worker
          ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          
          // 获取PDF数据
          const response = await fetch(pdfUrl)
          const arrayBuffer = await response.arrayBuffer()
          
          // 加载PDF文档
          const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise
          let fullText = ''
          
          // 提取所有页面的文本
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            
            // 改进文本提取，保持格式
            let pageText = ''
            let lastY = 0
            let lineText = ''
            
            textContent.items.forEach((item: any, index: number) => {
              const currentY = item.transform[5] // Y坐标
              const text = item.str
              
              // 如果是新行（Y坐标变化较大）
              if (Math.abs(currentY - lastY) > 5) {
                if (lineText.trim()) {
                  pageText += lineText.trim() + '\n'
                }
                lineText = text
              } else {
                // 同一行，检查是否需要空格
                if (lineText && !lineText.endsWith(' ') && !text.startsWith(' ')) {
                  lineText += ' ' + text
                } else {
                  lineText += text
                }
              }
              
              lastY = currentY
            })
            
            // 添加最后一行
            if (lineText.trim()) {
              pageText += lineText.trim() + '\n'
            }
            
            // 页面之间添加分隔
            if (pageText.trim()) {
              fullText += pageText + '\n\n'
            }
          }
          
          setExtractedText(fullText.trim())
          setShowTextView(true)
          setShowTextOptions(false)
          
          // 自动切换到文本视图
          console.log("[v0] Text extracted successfully, switching to text view")
          
          // 通知父组件文档文本已提取
          if (onDocumentTextExtracted) {
            onDocumentTextExtracted(fullText.trim())
          }
        } catch (error) {
          console.error("PDF解析失败:", error)
          setExtractedText("PDF解析失败，请尝试手动输入文本。")
        } finally {
          setIsExtracting(false)
        }
      }
      
      script.onerror = () => {
        console.error("PDF.js加载失败")
        setExtractedText("PDF解析器加载失败，请尝试手动输入文本。")
        setIsExtracting(false)
      }
      
      document.head.appendChild(script)
      
    } catch (error) {
      console.error("文本提取失败:", error)
      setExtractedText("文本提取失败，请尝试手动输入。")
      setIsExtracting(false)
    }
  }

  const handleTranslate = async (language: string) => {
    if (!extractedText.trim()) return
    
    try {
      setIsTranslating(true)
      setSelectedLanguage(language)
      
      // 调用翻译API
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedText,
          targetLanguage: language,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Translation failed")
      }
      
      const data = await response.json()
      setTranslatedText(data.translatedText)
      
    } catch (error) {
      console.error("Translation error:", error)
      setTranslatedText("翻译失败，请重试。")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleDocumentClick = (event: React.MouseEvent) => {
    // For iframe-based PDF viewing, text selection is limited
    // Users can still use the context menu for general actions
    console.log("[v0] Document clicked - iframe PDF loaded")
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (!window.getSelection()?.toString()) {
        setSelectedText("")
      }
      setShowContextMenu(false)
      setContextMenuPosition(null)
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Minimal Toolbar */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <FileTextIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-medium text-black text-sm">{fileName}</h2>
              <p className="text-xs text-gray-500">PDF Viewer</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!extractedText ? (
              <button 
                onClick={() => setShowTextOptions(true)}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
              >
                <FileTextIcon className="w-4 h-4" />
                Extract Text
              </button>
            ) : (
              <button 
                onClick={() => setShowTextView(!showTextView)}
                className="px-4 py-2 text-sm bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
              >
                <FileTextIcon className="w-4 h-4" />
                {showTextView ? "Back to PDF" : "Show Text"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-white relative" ref={containerRef}>
        <div className="p-4">
          {showTextView && extractedText ? (
            // Text View
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Extracted Text</h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="">Select Language</option>
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                    <option value="ru">Русский</option>
                  </select>
                  <button 
                    onClick={() => handleTranslate(selectedLanguage)}
                    disabled={!selectedLanguage || isTranslating}
                    className="px-3 py-1 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? "Translating..." : "Translate"}
                  </button>
                  {translatedText && (
                    <button 
                      onClick={() => setTranslatedText("")}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Show Original
                    </button>
                  )}
                </div>
              </div>
              <div 
                className="bg-gray-50 border border-gray-200 rounded p-4 max-h-[600px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap select-text"
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
              >
                {translatedText || extractedText}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Select text and right-click to analyze
                </div>
                <div className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                  {translatedText ? (
                    <>Translated to: {selectedLanguage === 'zh' ? '中文' : 
                                     selectedLanguage === 'en' ? 'English' :
                                     selectedLanguage === 'ja' ? '日本語' :
                                     selectedLanguage === 'ko' ? '한국어' :
                                     selectedLanguage === 'fr' ? 'Français' :
                                     selectedLanguage === 'de' ? 'Deutsch' :
                                     selectedLanguage === 'es' ? 'Español' :
                                     selectedLanguage === 'ru' ? 'Русский' : selectedLanguage}</>
                  ) : (
                    <>Original Text</>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // PDF View
            <div className="mx-auto" style={{ width: "fit-content" }}>
            <ContextMenu>
              <ContextMenuTrigger>
                  <div 
                    className="relative bg-white border border-gray-200 rounded min-h-[800px] min-w-[600px]"
                    onMouseUp={handleMouseUp}
                    onContextMenu={handleContextMenu}
                  >
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[800px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading PDF...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-[800px]">
                      <div className="text-center">
                        <p className="text-red-500 mb-2">Error loading PDF</p>
                        <p className="text-muted-foreground text-sm">{error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      {/* Try embed first */}
                      <embed
                        src={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full border-0"
                        style={{
                          minHeight: "800px",
                          width: "100%",
                          height: "100%",
                        }}
                        onLoad={() => {
                          console.log("[v0] PDF embed loaded")
                        }}
                        onError={() => {
                          console.error("[v0] PDF embed error, trying object")
                        }}
                      />
                      
                      {/* Fallback to object if embed fails */}
                      <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full border-0 hidden"
                      style={{
                          minHeight: "800px",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <p>Your browser doesn't support PDF viewing. 
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            Click here to download the PDF
                          </a>
                        </p>
                      </object>
                      
                      {/* User instructions */}
                      <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded p-3 text-xs text-gray-600">
                        <p className="mb-1">Right-click for actions</p>
                        <p><a href={pdfUrl} target="_blank" className="text-gray-900 hover:underline">Open in new tab</a></p>
                      </div>
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => {
                  // For iframe PDFs, we'll provide general document actions
                  const generalPrompt = "Can you help me understand this document? Please provide an overview and key points."
                  onTextSelected(generalPrompt, "explain")
                }}>
                  <HelpCircleIcon className="w-4 h-4 mr-2" />
                  Explain document
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                  const generalPrompt = "Please summarize this document for me."
                  onTextSelected(generalPrompt, "summarize")
                }}>
                  Summarize document
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
          )}
        </div>
      </div>

      {/* Minimal Text Options Panel */}
      {showTextOptions && (
        <div className="border-t border-gray-200 px-6 py-6 bg-white">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileTextIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h4 className="font-medium text-black mb-2">Extract PDF Text</h4>
              <p className="text-sm text-gray-600 mb-2">
                Extract all text from the PDF for analysis
              </p>
              <p className="text-xs text-gray-500">
                Text will be extracted once and saved for this session
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleExtractText}
                disabled={isExtracting}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                <FileTextIcon className="w-4 h-4" />
                {isExtracting ? "Extracting..." : "Extract Text"}
              </button>
              <button 
                onClick={() => setShowTextOptions(false)}
                className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Text Input Area */}
      {showTextInput && (
        <div className="border-t p-4 bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Analyze Text</h4>
              <button 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowTextInput(false)
                  setManualText("")
                }}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <textarea
                placeholder="Paste or type the text you want to analyze from the PDF..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full p-3 border rounded-md text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  onClick={() => handleManualTextAction("explain")}
                  disabled={!manualText.trim()}
                >
                  Explain
                </button>
                <button 
                  className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  onClick={() => handleManualTextAction("summarize")}
                  disabled={!manualText.trim()}
                >
                  Summarize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Context Menu - Only show in text view */}
      {showContextMenu && contextMenuPosition && showTextView && (
        <div
          className="fixed z-50 bg-white border rounded-lg shadow-lg p-1 min-w-[200px]"
            style={{
            left: Math.min(contextMenuPosition.x, window.innerWidth - 220),
            top: Math.min(contextMenuPosition.y, window.innerHeight - 120),
          }}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
            onClick={() => handleContextMenuAction("explain")}
          >
            Explain selected text
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
            onClick={() => handleContextMenuAction("summarize")}
          >
            Summarize selected text
          </button>
        </div>
      )}

      {/* Selected Text Indicator - Only show in text view */}
      {selectedText && showTextView && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-sm text-gray-700">
            Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Right-click to analyze
      </div>
        </div>
      )}
    </div>
  )
}
