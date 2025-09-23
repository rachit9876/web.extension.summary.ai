# Page Summarizer

A Chrome extension that uses AI to summarize web pages and answer questions about their content using the OpenRouter API.

## Features

- **Smart Summarization**: Generate structured summaries of any webpage with markdown formatting
- **Interactive Q&A**: Ask specific questions about the page content and get detailed answers
- **Session Memory**: Cached results persist during your browsing session
- **Clean UI**: Modern, responsive interface with tabbed navigation
- **Real-time Processing**: Fast AI-powered content analysis

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

## Usage

1. **Summarize Pages**: Click the extension icon and select "Summary" tab, then click "Generate Summary"
2. **Ask Questions**: Switch to "Ask" tab, enter your question, and click "Get Answer"
3. **View Results**: All responses are formatted with markdown for better readability

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Main interface with modern styling
- `popup.js` - Core functionality and API integration
- `content.js` - Page content extraction script

## Permissions

- `activeTab` - Access current page content
- `storage` - Cache results during session