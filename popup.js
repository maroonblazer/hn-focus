document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('save').addEventListener('click', () => {
    const maxArticles = document.getElementById('maxArticles').value;
    chrome.storage.sync.set({ maxArticles: parseInt(maxArticles, 10) }, () => {
      // Close the popup
      window.close();
    });
  });

  // Load saved settings
  chrome.storage.sync.get(['maxArticles'], (result) => {
    document.getElementById('maxArticles').value = result.maxArticles || 3;
  });

  // Add this new code for the reset button
  const resetButton = document.getElementById('resetButton');
  resetButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "resetExtension"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          // Clear all storage
          chrome.storage.sync.clear(function() {
            chrome.storage.local.clear(function() {
              // Reset max articles to 3
              chrome.storage.sync.set({maxArticles: 3}, function() {
                // Refresh the page
                chrome.tabs.reload(tabs[0].id);
              });
            });
          });
        }
      });
    });
  });
});
