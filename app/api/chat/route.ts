import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages, documentText } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // 添加系统消息，包含文档内容
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant that specializes in analyzing and explaining document content. 
      You help users understand PDF documents by:
      - Providing clear explanations of complex concepts
      - Summarizing content when requested
      - Answering questions about specific sections
      - Offering additional context and examples
      - Breaking down technical terms and jargon
      
      Always be helpful, accurate, and educational in your responses.
      
      ${documentText ? `Here is the full document content for reference:
      
      ${documentText}` : ''}`
    }

    // 将所有消息转换为OpenRouter格式
    const openRouterMessages = [systemMessage, ...messages]

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "Document Chatbot",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: openRouterMessages,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API request failed: ${response.status}`)
    }

    // 处理OpenRouter的流式响应并转换为AI SDK格式
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    // 转义特殊字符
                    const content = parsed.choices[0].delta.content
                      .replace(/\\/g, '\\\\')
                      .replace(/"/g, '\\"')
                      .replace(/\n/g, '\\n')
                      .replace(/\r/g, '\\r')
                      .replace(/\t/g, '\\t')
                    
                    // 转换为AI SDK格式
                    const aiSdkChunk = `0:{"type":"text-delta","textDelta":"${content}"}\n`
                    controller.enqueue(new TextEncoder().encode(aiSdkChunk))
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Chat request failed' },
      { status: 500 }
    )
  }
}
