import { getArticles } from './services/catalogueApi.js';
import {
    state, setArticles, setSearch, setStatus, setSort,
    resetFilters, hasActiveFilters, getVisibleArticles
} from './state/store.js';
import { renderArticles, clearList, showStatus, hideStatus } from './ui/display.js';

const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const sortSelect = document.getElementById('sort-select');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('catalogue-retry');
const resetBtn = document.getElementById('reset-filters');

// Redessine la liste avec la recherche, le filtre et le tri actuels
function updateList() {
    renderArticles(getVisibleArticles(), hasActiveFilters());
}

// Va chercher les articles sur le serveur
async function loadArticles() {
    // --- Chargement ---
    refreshBtn.disabled = true;
    retryBtn.disabled = true;
    showStatus('Chargement des articles...');

    try {
        const articles = await getArticles();

        // --- Succès ---
        setArticles(articles);
        updateList();
        hideStatus();
    } catch (error) {
        // --- Erreur ---
        clearList();
        showStatus(error.message, true);
    }

    refreshBtn.disabled = false;
    retryBtn.disabled = false;
}

// À chaque frappe ou changement : on met à jour l'état, puis la liste
searchInput.addEventListener('input', function () {
    setSearch(searchInput.value);
    updateList();
});

statusFilter.addEventListener('change', function () {
    setStatus(statusFilter.value);
    updateList();
});

sortSelect.addEventListener('change', function () {
    setSort(sortSelect.value);
    updateList();
});

// Réinitialiser : état à zéro, et les contrôles aussi
resetBtn.addEventListener('click', function () {
    resetFilters();
    searchInput.value = '';
    statusFilter.value = 'all';
    sortSelect.value = 'date-desc';
    updateList();
});

refreshBtn.addEventListener('click', loadArticles);
retryBtn.addEventListener('click', loadArticles);

// Premier chargement
loadArticles();