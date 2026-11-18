import { getArticles, createArticle } from './services/catalogueApi.js';
import {
    state, setArticles, addArticle, setSearch, setStatus, setSort,
    resetFilters, hasActiveFilters, getVisibleArticles
} from './state/store.js';
import { renderArticles, clearList, showStatus, hideStatus, showActionMessage } from './ui/display.js';
import { readForm, showFieldErrors, setFormBusy, resetForm } from './ui/form.js';
import { validateArticle } from './validation.js';

const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const sortSelect = document.getElementById('sort-select');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('catalogue-retry');
const resetBtn = document.getElementById('reset-filters');
const articleForm = document.getElementById('article-form');

// Redessine la liste avec la recherche, le filtre et le tri actuels
function updateList() {
    renderArticles(getVisibleArticles(), hasActiveFilters());
}

// Remet la recherche, le filtre et le tri à zéro (état ET contrôles)
function resetControls() {
    resetFilters();
    searchInput.value = '';
    statusFilter.value = 'all';
    sortSelect.value = 'date-desc';
}

// Va chercher les articles sur le serveur
async function loadArticles() {
    refreshBtn.disabled = true;
    retryBtn.disabled = true;
    showStatus('Chargement des articles...');

    try {
        const articles = await getArticles();
        setArticles(articles);
        updateList();
        hideStatus();
    } catch (error) {
        clearList();
        showStatus(error.message, true);
    }

    refreshBtn.disabled = false;
    retryBtn.disabled = false;
}

// ----- Créer un article (US-03) -----
articleForm.addEventListener('submit', async function (event) {
    event.preventDefault();   // on empêche le rechargement de la page

    // 1. On vérifie les champs
    const data = readForm();
    const errors = validateArticle(data);
    showFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
        return;   // il y a des erreurs : on s'arrête
    }

    // 2. Envoi : bouton bloqué
    setFormBusy(true);

    try {
        // 3. POST vers le serveur
        const created = await createArticle({
            title: data.title.trim(),
            description: data.description.trim(),
            price: Number(data.price),
            status: data.status,
            createdAt: new Date().toISOString()
        });

        // Succès : l'article arrive en tête de liste
        addArticle(created);
        resetControls();
        updateList();
        resetForm();
        showActionMessage('Article « ' + created.title + ' » ajouté au catalogue.', 'success');
    } catch (error) {
        // Erreur : on garde la saisie et on explique
        showActionMessage(error.message + ' Votre saisie est conservée : vous pouvez réessayer.', 'error');
    }

    setFormBusy(false);
});

// ----- Recherche, filtre et tri -----
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

resetBtn.addEventListener('click', function () {
    resetControls();
    updateList();
});

refreshBtn.addEventListener('click', loadArticles);
retryBtn.addEventListener('click', loadArticles);

// Premier chargement
loadArticles();