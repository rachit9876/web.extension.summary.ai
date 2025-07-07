# Page Summarizer: AI-Powered Web Content Analysis Chrome Extension

Page Summarizer is a Chrome extension that leverages the Gemini API to provide instant webpage summaries and answer questions about web content. It helps users quickly understand webpage content and extract relevant information through natural language interaction.

The extension offers two primary features: webpage summarization and a question-answering system. Using advanced natural language processing through the Gemini API, it generates well-structured summaries with proper markdown formatting and provides contextual answers to user questions about the webpage content. The extension maintains a clean, user-friendly interface with a tabbed layout and supports caching of results for improved performance.

## Repository Structure
```
.
├── content.js          # Content script for extracting webpage data
├── key.txt            # API key storage (should be kept secure)
├── manifest.json      # Chrome extension manifest configuration
├── popup.html         # Extension popup interface and styling
└── popup.js           # Main extension logic and API integration
```

## Usage Instructions
### Prerequisites
- Google Chrome browser
- Gemini API key (obtain from Google AI Studio)
- Active internet connection

### Installation
1. Clone the repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### Quick Start
1. Click the extension icon in Chrome toolbar
2. Enter your Gemini API key and click "Save API"
3. Navigate to any webpage you want to analyze
4. Click "Generate Summary" to get a concise overview
5. Switch to "Ask" tab to ask specific questions about the page

### More Detailed Examples
**Generating a Summary:**
```javascript
// Click the extension icon
// The extension will automatically extract the page content
// Click "Generate Summary" to receive a structured summary with:
- Main points
- Key facts
- Important details
```

**Asking Questions:**
```javascript
// Switch to the "Ask" tab
// Enter your question about the page content
// Example questions:
- "What are the main arguments presented?"
- "Summarize the key statistics mentioned"
- "What is the author's conclusion?"
```

### Troubleshooting
**Common Issues:**

1. API Key Issues
- Error: "Please enter your Gemini API key first"
- Solution: Enter a valid API key and click "Save API"
- Verify key format and permissions

2. Content Extraction Issues
- Error: "Unable to access page content"
- Solution: 
  * Refresh the page
  * Check if the page is fully loaded
  * Verify the page is not in a restricted domain

3. Performance Optimization
- Cache results using browser storage
- Limit content length to 8000 characters
- Use session storage for temporary data

## Data Flow
The extension processes webpage content through a structured pipeline from extraction to presentation.

```ascii
[Webpage] -> [Content Script] -> [Popup Interface] -> [Gemini API] -> [Formatted Results]
     |             |                    |                   |               |
     +--extracts-->+---sends data----->+----processes----->+---formats---->+
```

Component Interactions:
1. Content script (content.js) extracts page title and content
2. Popup interface (popup.js) manages user interactions and API key
3. Gemini API processes content and generates responses
4. Markdown formatter converts API responses to HTML
5. Browser storage caches results and settings
6. Message passing handles communication between components
7. Error handling manages API and content extraction failures
