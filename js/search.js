// search.js — Search, category filter and URL hash sync

export function initSearch(onFilter) {
  const input = document.getElementById('search-input');
  const buttons = document.querySelectorAll('[data-filter]');

  let currentCat = getHashCategory() || 'todos';
  let currentQuery = '';

  // Highlight active filter button
  function syncButtons() {
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === currentCat);
    });
  }

  // Read category from URL hash
  function getHashCategory() {
    const h = location.hash.replace('#', '');
    return h || null;
  }

  // Write category to URL hash (no scroll)
  function setHash(cat) {
    history.replaceState(null, '', cat === 'todos' ? location.pathname : '#' + cat);
  }

  // Filter buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.filter;
      setHash(currentCat);
      syncButtons();
      onFilter(currentQuery, currentCat);
    });
  });

  // Search input — debounced
  let timer;
  if (input) {
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        currentQuery = input.value.trim().toLowerCase();
        onFilter(currentQuery, currentCat);
      }, 200);
    });
  }

  // Hash change (back/forward browser)
  window.addEventListener('hashchange', () => {
    currentCat = getHashCategory() || 'todos';
    syncButtons();
    onFilter(currentQuery, currentCat);
  });

  // Initial sync
  syncButtons();
  onFilter(currentQuery, currentCat);
}
