let selectedCount = 0;
let maxSelected = 3; // Default value

// Function to load the maxSelected value
function loadMaxSelected() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['maxArticles'], (result) => {
      maxSelected = result.maxArticles || 3;
      resolve(maxSelected);
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

function addCheckboxes() {
  if (isCommentsPage()) {
    return; // Don't add checkboxes on comments pages
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
  }
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
    const checkbox = article.querySelector('.hn-selector');
    if (checkbox) {
      checkbox.checked = false;
    }
  });

  // Restore the "More" link
  const moreLink = document.querySelector('a.morelink');
  if (moreLink) {
    moreLink.style.display = '';
  }

  selectedCount = 0;
}

function saveState() {
  const state = {
    selectedArticles: Array.from(document.querySelectorAll('.hn-selector:checked')).map(
      (checkbox) => checkbox.closest('tr.athing').id
    ),
    filtered: selectedCount === maxSelected,
  };
  chrome.storage.local.set({ hnState: state });
}

function loadState() {
  chrome.storage.local.get(['hnState'], (result) => {
    if (result.hnState && result.hnState.filtered) {
      const articles = document.querySelectorAll('tr.athing');
      articles.forEach((article) => {
        const checkbox = article.querySelector('.hn-selector');
        if (checkbox) {
          checkbox.checked = result.hnState.selectedArticles.includes(article.id);
        }
      });
      filterArticles();
      selectedCount = maxSelected;
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
    maxSelected = changes.maxArticles.newValue;
    if (selectedCount > maxSelected) {
      restoreArticles();
    }
  }
});