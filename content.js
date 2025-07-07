function getPageContent() {
  const title = document.title || 'No title';
  const content = document.body?.innerText || document.documentElement?.innerText || 'No content found';
  return { 
    title, 
    content: content.slice(0, 8000).trim() || 'Page content unavailable'
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getContent") {
    const pageData = getPageContent();
    console.log('Content extracted:', pageData.title, pageData.content.length);
    sendResponse(pageData);
  }
  return true;
});