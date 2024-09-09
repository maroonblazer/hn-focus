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
