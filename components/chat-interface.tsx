"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { SendIcon, SparklesIcon, FileTextIcon, BrainIcon, BookOpenIcon } from "@/components/icons"

interface ChatInterfaceProps {
  fileName: string
  selectedText?: string
  selectedAction?: "explain" | "ask" | "summarize"
  documentText?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "selection" | "normal"
  selectedText?: string
}

export function ChatInterface({ fileName, selectedText, selectedAction, documentText }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI learning assistant for "${fileName}". I can help you understand the document by:

• **Explaining** complex concepts and terminology
• **Summarizing** sections or the entire document  
• **Answering questions** about specific content
• **Providing context** and additional examples
• **Breaking down** technical information

Select any text in the PDF and I'll help you understand it better!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>')
  }

  const sendMessage = async (content: string) => {
    console.log("[v0] Sending message:", content)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content }],
          documentText: documentText
        }),
      })

      console.log("[v0] Response status:", response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      // Create AI message that will be updated as we stream
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])

      let aiResponse = ""
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        console.log("[v0] Received chunk:", chunk)

        // Handle AI SDK data stream format
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the AI SDK format
            try {
              const data = JSON.parse(line.slice(2))
              if (data.type === "text-delta" && data.textDelta) {
                aiResponse += data.textDelta
                // Update the message in real-time
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg)),
                )
              }
            } catch (e) {
              console.log("[v0] Failed to parse chunk:", line)
              // Skip invalid chunks instead of treating as plain text
            }
          }
        }
      }

      console.log("[v0] Final AI response:", aiResponse)
      
      // 如果AI回复为空，显示错误消息
      if (!aiResponse.trim()) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having trouble connecting to the AI service right now. Please check your API key configuration.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      // Fallback to mock response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting to the AI service right now. In a real implementation, I would analyze your document and provide intelligent responses based on the content.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedText && selectedAction) {
      console.log("[v0] Selected text:", selectedText)
      console.log("[v0] Selected action:", selectedAction)

      let prompt = ""
      switch (selectedAction) {
        case "explain":
          prompt = `Please explain this text from the document: "${selectedText}"`
          break
        case "ask":
          prompt = `I have a question about this text: "${selectedText}". Can you help me understand it better?`
          break
        case "summarize":
          prompt = `Please summarize this text: "${selectedText}"`
          break
      }

      if (prompt) {
        // Add user message for selected text
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: prompt,
          timestamp: new Date(),
          type: "selection",
          selectedText,
        }
        setMessages((prev) => [...prev, userMessage])
        setIsLoading(true)
        sendMessage(prompt)
      }
    }
  }, [selectedText, selectedAction])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = input
    setInput("")
    setIsLoading(true)

    await sendMessage(messageContent)
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Minimal Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <BrainIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-black text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500">Powered by OpenRouter</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{fileName}</span>
          {documentText && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span className="text-xs text-white font-medium">Loaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-auto" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <BrainIcon className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[85%] ${message.role === "user" ? "order-1" : ""}`}>
                {message.type === "selection" && message.selectedText && (
                  <div className="mb-2">
                    <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      <BookOpenIcon className="w-3 h-3 mr-1" />
                      Selected text
                    </div>
                  </div>
                )}

                <Card className={`p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div 
                    className="text-sm markdown-content"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                  />
                  <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </Card>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <BrainIcon className="w-4 h-4 text-white" />
              </div>
              <Card className="bg-muted p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Analyzing document...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Input */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white">
        <div className="flex gap-3">
          <Input
            placeholder="Ask about the document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
            className="flex-1 border-gray-300 focus:border-black focus:ring-0 rounded-lg"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            size="sm" 
            className="bg-black hover:bg-gray-800 rounded-lg px-4"
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
