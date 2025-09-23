let apiKey = '';
let pageContent = '';
let currentUrl = '';

// Set OpenRouter API key
apiKey = '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';

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



document.getElementById('summarize').addEventListener('click', async () => {
  if (!apiKey) {
    alert('API key not configured');
    return;
  }
  
  const summaryDiv = document.getElementById('summary');
  summaryDiv.innerHTML = '<div class="loading">Generating summary...</div>';
  
  try {
    await getPageContentIfNeeded();
    const summary = await callOpenRouterAPI(`Please provide a well-structured summary of this webpage using markdown formatting. Use headers, bullet points, and proper formatting. Focus on key facts and main points:\n\n${pageContent}`);
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
    alert('Please enter a question');
    return;
  }
  
  const answerDiv = document.getElementById('answer');
  answerDiv.innerHTML = '<div class="loading">Getting answer...</div>';
  
  try {
    await getPageContentIfNeeded();
    const answer = await callOpenRouterAPI(`Based on this webpage content, provide a well-formatted answer using markdown. Use headers, bullet points, code blocks, and proper formatting where appropriate.\n\nQuestion: ${question}\n\nWebpage content:\n${pageContent}`);
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
  // Decode HTML entities first
  text = text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  
  // Always use basicMarkdownFormat for consistency
  return basicMarkdownFormat(text);
}

function basicMarkdownFormat(text) {
  return text
    // Images
    .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;">')
    // Links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
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
    .replace(/^[\*\-] (.*)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
    // Blockquotes
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h1-6ul]|<blockquote|<img)(.+)$/gm, '<p>$1</p>')
    // Clean up
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[h1-6ul])/g, '$1')
    .replace(/(<\/[h1-6ul]>)<\/p>/g, '$1')
    .replace(/<p>(<img)/g, '$1')
    .replace(/(<\/img>)<\/p>/g, '$1');
}

async function callOpenRouterAPI(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}