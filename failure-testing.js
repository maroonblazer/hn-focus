document.addEventListener('HNFocusTest', function(e) {
  const testFunctions = {
    fillStorage: function() {
      let data = '';
      while (data.length < 5 * 1024 * 1024) { // 5MB of data
        data += 'a';
      }
      chrome.storage.local.set({testData: data}, () => {
        if (chrome.runtime.lastError) {
          notifyUser('Storage full: ' + chrome.runtime.lastError.message);
        } else {
          notifyUser('Storage filled');
        }
      });
    },

    simulateStorageError: function() {
      const originalSet = chrome.storage.local.set;
      chrome.storage.local.set = function(data, callback) {
        if (Math.random() < 0.5) { // 50% chance of failure
          callback(new Error('Simulated error'));
          notifyUser('Simulated storage error occurred');
        } else {
          originalSet.call(this, data, callback);
        }
      };
      notifyUser('Storage error simulation active');
    },

    setInvalidData: function() {
      chrome.storage.local.set({hnState: 'invalid data'}, () => {
        notifyUser('Set invalid data');
      });
    },

    clearStorage: function() {
      Promise.all([
        new Promise(resolve => chrome.storage.local.clear(resolve)),
        new Promise(resolve => chrome.storage.sync.clear(resolve))
      ]).then(() => {
        notifyUser('All storage cleared');
        // Send a message to the popup to update its UI
        chrome.runtime.sendMessage({action: 'storageCleared'});
        // Reload the page to reset the extension state
        window.location.reload();
      });
    },

    simulateDelay: function() {
      const originalSet = chrome.storage.local.set;
      chrome.storage.local.set = function(data, callback) {
        setTimeout(() => {
          originalSet.call(this, data, callback);
        }, 5000); // 5 second delay
      };
      notifyUser('Storage delay simulation active');
    }
  };

  if (testFunctions[e.detail.function]) {
    testFunctions[e.detail.function]();
  } else {
    notifyUser('Test function not found: ' + e.detail.function);
  }
});

function notifyUser(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff6600; color: white; text-align: center; padding: 10px; z-index: 9999;';
  document.body.prepend(notification);
  setTimeout(() => notification.remove(), 5000); // Remove after 5 seconds
  console.log('HN Focus Test:', message); // Also log to console
}

console.log('HN Focus test functions loaded. Available functions: fillStorage, simulateStorageError, setInvalidData, clearStorage, simulateDelay');
