let apiKey = '';
let pageContent = '';
let currentUrl = '';

// Load saved API key and cached results
chrome.storage.sync.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    apiKey = result.geminiApiKey;
    document.getElementById('apiKey').value = apiKey;
  }
});

// Load cached results for current URL
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  currentUrl = tabs[0].url;
  chrome.storage.session.get([`summary_${currentUrl}`, `lastQuestion_${currentUrl}`, `lastAnswer_${currentUrl}`], (result) => {
    if (result[`summary_${currentUrl}`]) {
      document.getElementById('summary').innerHTML = result[`summary_${currentUrl}`];
    }
    if (result[`lastQuestion_${currentUrl}`] && result[`lastAnswer_${currentUrl}`]) {
      document.getElementById('question').value = result[`lastQuestion_${currentUrl}`];
      document.getElementById('answer').innerHTML = result[`lastAnswer_${currentUrl}`];
    }
  });
});

// Tab functionality
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    document.getElementById(targetTab + '-tab').classList.add('active');
  });
});

// Enter key support for question input
document.getElementById('question').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('askQuestion').click();
  }
});

// Get page content when popup opens
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {action: "getContent"}, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Content script not ready, will get content on demand');
      return;
    }
    if (response) {
      pageContent = `Title: ${response.title}\n\nContent: ${response.content}`;
    }
  });
});

document.getElementById('changeApi').addEventListener('click', () => {
  apiKey = document.getElementById('apiKey').value;
  if (apiKey) {
    chrome.storage.sync.set({geminiApiKey: apiKey});
    alert('API Key saved!');
  }
});

document.getElementById('summarize').addEventListener('click', async () => {
  if (!apiKey) {
    alert('Please enter your Gemini API key first');
    return;
  }
  
  const summaryDiv = document.getElementById('summary');
  summaryDiv.innerHTML = '<div class="loading">Generating summary...</div>';
  
  try {
    await getPageContentIfNeeded();
    const summary = await callGeminiAPI(`Please provide a well-structured summary of this webpage using markdown formatting. Use headers, bullet points, and proper formatting. Focus on key facts and main points:\n\n${pageContent}`);
    const formattedSummary = formatResponse(summary);
    summaryDiv.innerHTML = formattedSummary;
    chrome.storage.session.set({[`summary_${currentUrl}`]: formattedSummary});
  } catch (error) {
    summaryDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
});

document.getElementById('askQuestion').addEventListener('click', async () => {
  const question = document.getElementById('question').value;
  if (!question || !apiKey) {
    alert('Please enter both API key and question');
    return;
  }
  
  const answerDiv = document.getElementById('answer');
  answerDiv.innerHTML = '<div class="loading">Getting answer...</div>';
  
  try {
    await getPageContentIfNeeded();
    const answer = await callGeminiAPI(`Based on this webpage content, provide a well-formatted answer using markdown. Use headers, bullet points, code blocks, and proper formatting where appropriate.\n\nQuestion: ${question}\n\nWebpage content:\n${pageContent}`);
    const formattedAnswer = formatResponse(answer);
    answerDiv.innerHTML = formattedAnswer;
    chrome.storage.session.set({
      [`lastQuestion_${currentUrl}`]: question,
      [`lastAnswer_${currentUrl}`]: formattedAnswer
    });
  } catch (error) {
    answerDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
});

async function getPageContentIfNeeded() {
  if (pageContent && pageContent !== 'Unable to access page content') return;
  
  return new Promise((resolve) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getContent"}, (response) => {
        if (chrome.runtime.lastError || !response) {
          console.log('Error getting content:', chrome.runtime.lastError);
          pageContent = 'Unable to access page content';
        } else {
          pageContent = `Title: ${response.title}\n\nContent: ${response.content}`;
          console.log('Got content:', response.title, response.content.length);
        }
        resolve();
      });
    });
  });
}

function formatResponse(text) {
  try {
    // Use marked.js if available, otherwise fallback to basic formatting
    if (typeof marked !== 'undefined') {
      return marked.parse(text);
    }
    return basicMarkdownFormat(text);
  } catch (error) {
    return basicMarkdownFormat(text);
  }
}

function basicMarkdownFormat(text) {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
}

async function callGeminiAPI(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}