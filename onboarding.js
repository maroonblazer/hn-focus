function createOnboardingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'hn-selector-onboarding';
  overlay.innerHTML = `
    <div class="onboarding-content">
      <h2>Welcome to HN Focus!</h2>
      <p>This extension encourages focus, by allowing you to select and filter only the most important Hacker News articles.</p>
      <ul>
        <li>Use the checkboxes to select articles you're most interested in.</li>
        <li>Once you've selected the maximum number of articles, the page will filter to show only those articles.</li>
        <li>Click the extension icon to change the maximum number of selectable articles. Use at your own risk.</li>
      </ul>
      <button id="hn-selector-onboarding-close">Got it!</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('hn-selector-onboarding-close').addEventListener('click', () => {
    overlay.style.display = 'none';
    chrome.storage.sync.set({ onboardingComplete: true });
  });
}

chrome.storage.sync.get(['onboardingComplete'], (result) => {
  if (!result.onboardingComplete) {
    createOnboardingOverlay();
  }
});
