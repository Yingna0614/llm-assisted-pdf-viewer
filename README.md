# LLM-assisted Pdf Viewer
Transform your PDF documents into intelligent insights with our AI-powered analysis tool. Simply upload any PDF, extract its text, and engage in real-time conversations with an AI assistant that understands your document's content. Get instant summaries, explanations, and translations in 8 languages. Perfect for researchers, students, and professionals who need quick document analysis without the complexity.

## Demo

Watch the Document Assistant in action:

[![Document Assistant Demo](https://img.shields.io/badge/📹_Watch_Demo-Video-blue?style=for-the-badge)](https://drive.google.com/file/d/1MJSno2L64SfDfLkg9TisRCzzkZ1uQRvn/view?usp=drive_link)

*Click the button above to see how easy it is to upload, analyze, and chat with your PDF documents.* 

## Features

- **PDF Document Upload** - Drag and drop support, up to 10MB
- **Smart Text Extraction** - Complete document text extraction using PDF.js
- **AI Analysis** - Intelligent document analysis powered by OpenRouter
- **Real-time Chat** - Interactive conversation with AI assistant for document insights
- **Multi-language Translation** - Support for 8 languages document translation
- **Local Storage** - Automatic document saving to local storage
- **Minimalist Design** - Black and white color scheme with modern interface

## Quick Start

### Requirements

- Node.js 18+
- pnpm (recommended) or npm

### Install Dependencies

```bash
pnpm install
```

### Configure API Key

Create a `.env.local` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to get started.

## User Guide

1. **Upload Document** - Click upload area or drag and drop PDF file
2. **Extract Text** - Click "Extract Text" button to extract document content
3. **Start Analysis** - Chat with AI assistant in the right panel
4. **Translate Document** - Select target language in text view for translation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (minimal version)
- **PDF Processing**: PDF.js
- **AI Service**: OpenRouter API
- **Package Manager**: pnpm

## Project Structure

```
document-chatbot/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page
├── components/
│   ├── ui/            # UI components
│   ├── chat-interface.tsx
│   ├── pdf-viewer.tsx
│   └── icons.tsx
└── lib/
    └── utils.ts       # Utility functions
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome to improve this project.

## 🔗 Links

- **GitHub Repository**: [llm-assisted-pdf-viewer](https://github.com/Yingna0614/llm-assisted-pdf-viewer)
- **Demo Video**: [Watch Demo](https://drive.google.com/file/d/1MJSno2L64SfDfLkg9TisRCzzkZ1uQRvn/view?usp=drive_link)

---

**Note**: Please ensure you have configured the OpenRouter API key before use.
