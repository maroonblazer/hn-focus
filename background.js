chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('https://news.ycombinator.com/')) {
    chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' });
  }
});