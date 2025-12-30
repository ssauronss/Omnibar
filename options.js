const browser = globalThis.browser || globalThis.chrome;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('version').textContent = `v${browser.runtime.getManifest().version}`;
});
