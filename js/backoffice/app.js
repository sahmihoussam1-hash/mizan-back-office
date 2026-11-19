import {
    getArticle, getArticles, createArticle, replaceArticle, patchArticle, deleteArticle
} from './services/catalogueApi.js';
import {
    state, setArticles, addArticle, removeArticle, restoreArticle, replaceInState,
    setSearch, setStatus, setSort, resetFilters, hasActiveFilters, getVisibleArticles
} from './state/store.js';
import {
    renderArticles, clearList, showStatus, showError, hideStatus, showActionMessage,
    showOfflineBanner, hideOfflineBanner, showSkeleton
} from './ui/display.js';
import { readForm, showFieldErrors, setFormBusy, startEditing, resetForm } from './ui/form.js';
import { askConfirmation } from './ui/modals.js';
import {
    initDetail, openDetail, showDetailArticle, showDetailError
} from './ui/detail.js';
import { validateArticle } from './validation.js';
import { saveCache, readCache, isFresh } from './storage/storage.js';

const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const sortSelect = document.getElementById('sort-select');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('catalogue-retry');
const resetBtn = document.getElementById('reset-filters');
const articleForm = document.getElementById('article-form');
const cancelEditBtn = document.getElementById('article-cancel');
const listContainer = document.getElementById('catalogue-container');

// L'id de l'article en cours de modification (null = on crée un nouvel article)
let editingId = null;

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

function findArticle(id) {
    return state.articles.find(function (item) {
        return item.id === id;
    });
}

// Le serveur est-il injoignable ? (dans ce cas, on peut utiliser le carnet)
function isUnreachable(error) {
    if (error.type === 'offline' || error.type === 'network' || error.type === 'timeout') {
        return true;
    }
    return error.type === 'http' && error.status >= 500;
}

// Si le serveur répond 404, l'article n'existe plus : on recharge la liste
function refreshIfMissing(error) {
    if (error.type === 'http' && error.status === 404) {
        loadArticles(true);
    }
}

// ----- Charger les articles (US-02 et US-07) -----
// forceNetwork = true : on ignore le carnet et on appelle toujours le serveur
async function loadArticles(forceNetwork = false) {
    // 1. Un carnet de moins de 5 minutes ? On l'utilise, sans appeler le serveur
    if (!forceNetwork) {
        const cached = readCache();
        if (cached !== null && isFresh(cached)) {
            setArticles(cached.items);
            hideOfflineBanner();
            hideStatus();
            updateList();
            return;
        }
    }

    // 2. Sinon : état CHARGEMENT, puis appel au serveur
    refreshBtn.disabled = true;
    retryBtn.disabled = true;
    showStatus('Chargement des articles...');
    showSkeleton();

    try {
        const articles = await getArticles();
        setArticles(articles);
        saveCache(articles);
        hideOfflineBanner();
        updateList();
        hideStatus();
    } catch (error) {
        // 3. Serveur injoignable : a-t-on un carnet, même ancien ?
        const cached = readCache();
        if (cached !== null && isUnreachable(error)) {
            setArticles(cached.items);
            updateList();
            hideStatus();
            showOfflineBanner(cached.savedAt);
        } else {
            // État ERREUR
            hideOfflineBanner();
            clearList();
            showError(error);
        }
    }

    refreshBtn.disabled = false;
    retryBtn.disabled = false;
}

// ----- Afficher le détail d'un article : GET /:id (US-02) -----
async function showDetail(id) {
    openDetail();
    try {
        const article = await getArticle(id);
        showDetailArticle(article);
    } catch (error) {
        // Si l'article a été créé localement ou serveur hors-ligne, on regarde dans l'état local
        const localArticle = findArticle(id);
        if (localArticle) {
            showDetailArticle(localArticle);
        } else {
            showDetailError(error);
        }
    }
}

// ----- Supprimer un article : DELETE avec mise à jour optimiste (US-05) -----
async function handleDelete(id) {
    const article = findArticle(id);
    if (!article) return;

    const confirmed = await askConfirmation(
        'Voulez-vous vraiment supprimer l’article « ' + article.title + ' » ?'
    );
    if (!confirmed) return;

    // 1. Mise à jour optimiste : on retire immédiatement de l'état et on met à jour l'écran
    const backup = removeArticle(id);
    if (editingId === id) {
        editingId = null;
        resetForm();
    }
    updateList();

    try {
        // 2. Appel API DELETE
        await deleteArticle(id);
        saveCache(state.articles);
        showActionMessage('Article « ' + article.title + ' » supprimé.', 'success');
    } catch (error) {
        // 3. En cas d'échec API : on restaure l'article à sa position d'origine
        restoreArticle(backup);
        updateList();
        showActionMessage(
            error.message + ' L’article a été restauré dans la liste.',
            'error'
        );
        refreshIfMissing(error);
    }
}

// ----- Modifier une partie de l'article : PATCH (US-04) -----
async function handlePatch(id, changes, control) {
    control.disabled = true;
    showActionMessage('Modification en cours...', 'info');

    try {
        const updated = await patchArticle(id, changes);
        replaceInState(updated);
        saveCache(state.articles);
        updateList();
        showActionMessage('Article « ' + updated.title + ' » mis à jour.', 'success');
    } catch (error) {
        updateList();
        showActionMessage(error.message, 'error');
        refreshIfMissing(error);
    }
}

// ----- Les boutons de la liste (un seul écouteur pour tous) -----
listContainer.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const id = Number(button.dataset.id);

    if (button.dataset.action === 'detail') {
        showDetail(id);
    }

    if (button.dataset.action === 'delete') {
        handleDelete(id);
    }

    if (button.dataset.action === 'edit') {
        editingId = id;
        startEditing(findArticle(id));
    }

    if (button.dataset.action === 'price') {
        const input = button.closest('.quick-edit').querySelector('.price-input');
        const price = Number(input.value);
        if (input.value.trim() === '' || isNaN(price) || price <= 0) {
            showActionMessage('Le prix doit être un nombre supérieur à 0.', 'error');
            return;
        }
        handlePatch(id, { price: price }, button);
    }
});

// La liste déroulante du statut (PATCH dès qu'on change la valeur)
listContainer.addEventListener('change', function (event) {
    const select = event.target.closest('select');
    if (select && select.dataset.action === 'status') {
        handlePatch(Number(select.dataset.id), { status: select.value }, select);
    }
});

// ----- Créer (POST) ou remplacer (PUT) avec le formulaire -----
articleForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const data = readForm();
    const errors = validateArticle(data);
    showFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
        return;
    }

    setFormBusy(true);

    try {
        if (editingId === null) {
            // --- Création : POST ---
            const created = await createArticle({
                title: data.title.trim(),
                description: data.description.trim(),
                price: Number(data.price),
                status: data.status,
                createdAt: new Date().toISOString()
            });

            addArticle(created);
            saveCache(state.articles);
            resetControls();
            updateList();
            resetForm();
            showActionMessage('Article « ' + created.title + ' » ajouté au catalogue.', 'success');
        } else {
            // --- Modification complète : PUT (on envoie TOUS les champs) ---
            const original = findArticle(editingId);
            let createdAt = new Date().toISOString();
            if (original) {
                createdAt = original.createdAt;
            }

            const updated = await replaceArticle(editingId, {
                id: editingId,
                title: data.title.trim(),
                description: data.description.trim(),
                price: Number(data.price),
                status: data.status,
                createdAt: createdAt
            });

            replaceInState(updated);
            saveCache(state.articles);
            editingId = null;
            updateList();
            resetForm();
            showActionMessage('Article « ' + updated.title + ' » modifié.', 'success');
        }
    } catch (error) {
        showActionMessage(error.message + ' Votre saisie est conservée : vous pouvez réessayer.', 'error');
        refreshIfMissing(error);
    }

    setFormBusy(false);
});

// Annuler la modification
cancelEditBtn.addEventListener('click', function () {
    editingId = null;
    resetForm();
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

// « Rafraîchir » et « Réessayer » forcent l'appel au serveur
refreshBtn.addEventListener('click', function () {
    loadArticles(true);
});

retryBtn.addEventListener('click', function () {
    loadArticles(true);
});

// ----- Lancement au démarrage de la page -----
initDetail();
loadArticles();