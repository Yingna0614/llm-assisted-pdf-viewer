Transform your PDF documents into intelligent insights with our AI-powered analysis tool. Simply upload any PDF, extract its text, and engage in real-time conversations with an AI assistant that understands your document's content. Get instant summaries, explanations, and translations in 8 languages. Perfect for researchers, students, and professionals who need quick document analysis without the complexity.

## Demo

Watch the Document Assistant in action:

[![Document Assistant Demo](https://img.shields.io/badge/📹_Watch_Demo-Video-blue?style=for-the-badge)](https://drive.google.com/file/d/1MJSno2L64SfDfLkg9TisRCzzkZ1uQRvn/view?usp=drive_link)

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

Issues and Pull Requests are welcome to improve this project.
