const HN_FOCUS_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="16" x2="12" y2="12"></line>
  <line x1="12" y1="8" x2="12" y2="8"></line>
</svg>`;

let selectedCount = 0;
let maxSelected = 3; // Default value

// Function to load the maxSelected value
function loadMaxSelected() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['maxArticles'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading maxArticles:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        maxSelected = result.maxArticles !== undefined ? result.maxArticles : 3;
        resolve(maxSelected);
      }
    });
  });
}

// Load the maxSelected value before adding checkboxes
loadMaxSelected().then(() => {
  addCheckboxes();
});

function isCommentsPage() {
  return window.location.pathname.includes('item');
}

function isFavoritesPage() {
  return window.location.pathname.includes('favorites');
}

function addCheckboxes() {
  if (isCommentsPage() || isFavoritesPage()) {
    return; // Don't add checkboxes on comments or favorites pages
  }

  const articles = document.querySelectorAll('tr.athing');
  articles.forEach((article) => {
    if (!article.querySelector('.hn-selector')) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'hn-selector';
      checkbox.addEventListener('change', handleCheckboxChange);
      
      // Add a wrapper for better positioning
      const wrapper = document.createElement('span');
      wrapper.style.display = 'inline-block';
      wrapper.style.verticalAlign = 'middle';
      wrapper.appendChild(checkbox);
      
      const titleElement = article.querySelector('.title');
      if (titleElement) {
        titleElement.prepend(wrapper);
      }
    }
  });
}

function handleCheckboxChange(event) {
  if (event.target.checked) {
    selectedCount++;
    if (selectedCount === maxSelected) {
      filterArticles();
    }
  } else {
    selectedCount--;
    if (isPageFiltered() && selectedCount < maxSelected) {
      restoreArticles();
    }
  }
  saveState(); // Add this line
}

function isPageFiltered() {
  // Check if the page is filtered by checking if any article is hidden
  return document.querySelectorAll('tr.athing[style*="display: none"]').length > 0;
}

function filterArticles() {
  const articles = document.querySelectorAll('tr.athing');
  articles.forEach((article) => {
    const checkbox = article.querySelector('.hn-selector');
    if (!checkbox.checked) {
      article.style.display = 'none';
      article.nextElementSibling.style.display = 'none';
      article.nextElementSibling.nextElementSibling.style.display = 'none';
    }
  });

  // Remove the "More" link
  const moreLink = document.querySelector('a.morelink');
  if (moreLink) {
    moreLink.style.display = 'none';
  }
}

function restoreArticles() {
  const articles = document.querySelectorAll('tr.athing');
  articles.forEach((article) => {
    article.style.display = '';
    article.nextElementSibling.style.display = '';
    article.nextElementSibling.nextElementSibling.style.display = '';
  });

  // Restore the "More" link
  const moreLink = document.querySelector('a.morelink');
  if (moreLink) {
    moreLink.style.display = '';
  }

  selectedCount = document.querySelectorAll('.hn-selector:checked').length;
}

function saveState() {
  const state = {
    selectedArticles: Array.from(document.querySelectorAll('.hn-selector:checked')).map(
      (checkbox) => checkbox.closest('tr.athing').id
    ),
    filtered: selectedCount === maxSelected,
  };
  chrome.storage.local.set({ hnState: state }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving state:', chrome.runtime.lastError);
      // Optionally, notify the user
    }
  });
}

function loadState() {
  chrome.storage.local.get(['hnState'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading state:', chrome.runtime.lastError);
      return;
    }
    if (result.hnState && result.hnState.filtered) {
      try {
        const articles = document.querySelectorAll('tr.athing');
        articles.forEach((article) => {
          const checkbox = article.querySelector('.hn-selector');
          if (checkbox) {
            checkbox.checked = result.hnState.selectedArticles.includes(article.id);
          }
        });
        filterArticles();
        selectedCount = maxSelected;
      } catch (error) {
        console.error('Error restoring state:', error);
        // Optionally, reset the state or notify the user
      }
    }
  });
}

// Modify the initial setup
function initialize() {
  loadMaxSelected().then(() => {
    if (!isCommentsPage()) {
      addCheckboxes();
      loadState();
    }
  }).catch(error => {
    console.error('Error initializing:', error);
    // Fall back to default functionality
    if (!isCommentsPage()) {
      addCheckboxes();
    }
  });
}

// Call initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Modify the MutationObserver to respect the comments page condition
const observer = new MutationObserver((mutations) => {
  if (!isCommentsPage()) {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        addCheckboxes();
      }
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Add a listener for changes to the maxArticles setting
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.maxArticles) {
    const oldValue = changes.maxArticles.oldValue ?? 3; // Default to 3 if undefined
    const newValue = changes.maxArticles.newValue;
    maxSelected = newValue;

    // Add these console.log messages here
    console.log('Max articles changed:', oldValue, '->', newValue);
    console.log('Current selected count:', selectedCount);
    console.log('Page filtered:', isPageFiltered());

    // Rest of the listener function...
    if (newValue < oldValue) {
      // Always adjust selections when max is decreased, even if page is filtered
      const checkboxes = Array.from(document.querySelectorAll('.hn-selector:checked'));
      let deselectedCount = 0;
      checkboxes.forEach((checkbox, index) => {
        if (index >= newValue) {
          checkbox.checked = false;
          deselectedCount++;
        }
      });
      
      selectedCount = newValue;
      
      // Apply filtering after adjusting selections
      filterArticles();
      
      if (deselectedCount > 0) {
        notifyUser(`Max articles reduced to ${newValue}.<br>
        ${deselectedCount} selection(s) have been cleared and the page has been filtered.`);
      }
      // No notification if no articles were deselected
    } else if (newValue > oldValue && isPageFiltered()) {
      // Restore all articles when max is increased and the page is currently filtered
      restoreArticles();
      
      notifyUser(`Max articles increased to ${newValue}. All articles have been restored. You can now select more articles.`);
    }
    // No notification if max is increased but page isn't filtered
  }
});

function notifyUser(message) {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.hn-focus-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'hn-focus-notification';
  
  // Create icon element
  const iconElement = document.createElement('span');
  iconElement.innerHTML = HN_FOCUS_ICON;
  iconElement.style.marginRight = '10px';
  iconElement.style.display = 'inline-block';
  iconElement.style.verticalAlign = 'middle';

  // Create text element
  const textElement = document.createElement('span');
  textElement.innerHTML = message; // Changed from textContent to innerHTML
  textElement.style.display = 'inline-block';
  textElement.style.verticalAlign = 'middle';

  // Append icon and text to notification
  notification.appendChild(iconElement);
  notification.appendChild(textElement);
  
  // Apply styles to the notification
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff6600;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-size: 14px;
    max-width: 300px;
    text-align: left;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease-in-out;
    display: flex;
    align-items: center;
  `;

  document.body.appendChild(notification);

  // Fade out and remove the notification after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add error notification
if (chrome.runtime.lastError) {
  console.error('Error:', chrome.runtime.lastError);
  notifyUser('HN Focus encountered an error. Some features may be unavailable.');
}