chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storageCleared') {
    document.getElementById('maxArticles').value = 3; // Reset to default
  }
});

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(['maxArticles'], (result) => {
    document.getElementById('maxArticles').value = result.maxArticles || 3; // Default to 3 if not set
  });
}

// Call loadSettings when the popup opens
document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('save').addEventListener('click', () => {
  const maxArticles = document.getElementById('maxArticles').value;
  chrome.storage.sync.set({ maxArticles: parseInt(maxArticles, 10) }, () => {
    // Close the popup
    window.close();
  });
});

// Add event listeners for test function buttons
['fillStorage', 'simulateStorageError', 'setInvalidData', 'clearStorage', 'simulateDelay'].forEach(functionName => {
  document.getElementById(functionName).addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'runHNFocusTest', functionName: functionName}, function(response) {
        console.log(response.status);
      });
    });
  });
});
