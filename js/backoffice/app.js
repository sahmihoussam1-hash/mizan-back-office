import {
    getArticles, createArticle, replaceArticle, patchArticle, deleteArticle
} from './services/catalogueApi.js';
import {
    state, setArticles, addArticle, removeArticle, restoreArticle, replaceInState,
    setSearch, setStatus, setSort, resetFilters, hasActiveFilters, getVisibleArticles
} from './state/store.js';
import { renderArticles, clearList, showStatus, hideStatus, showActionMessage } from './ui/display.js';
import { readForm, showFieldErrors, setFormBusy, startEditing, resetForm } from './ui/form.js';
import { askConfirmation } from './ui/modals.js';
import { validateArticle } from './validation.js';

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

// ----- Supprimer un article (US-05) -----
async function handleDelete(id) {
    const article = findArticle(id);
    if (!article) {
        return;
    }

    const confirmed = await askConfirmation(
        'Supprimer cet article ?',
        '« ' + article.title + ' » sera retiré du catalogue.',
        'Supprimer'
    );
    if (!confirmed) {
        return;
    }

    // Si on était en train de modifier cet article, on annule la modification
    if (editingId === id) {
        editingId = null;
        resetForm();
    }

    // Mise à jour optimiste : on retire l'article tout de suite
    const index = state.articles.indexOf(article);
    removeArticle(id);
    updateList();

    try {
        await deleteArticle(id);
        showActionMessage('Article « ' + article.title + ' » supprimé.', 'success');
    } catch (error) {
        restoreArticle(article, index);
        updateList();
        showActionMessage(error.message + " L'article a été remis dans la liste.", 'error');
    }
}

// ----- Modifier une partie de l'article : PATCH (US-04) -----
async function handlePatch(id, changes, control) {
    control.disabled = true;   // retour visuel : le contrôle est bloqué pendant l'envoi
    showActionMessage('Modification en cours...', 'info');

    try {
        const updated = await patchArticle(id, changes);
        replaceInState(updated);
        updateList();
        showActionMessage('Article « ' + updated.title + ' » mis à jour.', 'success');
    } catch (error) {
        updateList();   // les contrôles reprennent leur ancienne valeur
        showActionMessage(error.message, 'error');
    }
}

// ----- Les boutons de la liste (un seul écouteur pour tous) -----
listContainer.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }
    const id = Number(button.dataset.id);

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
            editingId = null;
            updateList();
            resetForm();
            showActionMessage('Article « ' + updated.title + ' » modifié.', 'success');
        }
    } catch (error) {
        // Erreur : on garde la saisie dans le formulaire
        showActionMessage(error.message + ' Votre saisie est conservée : vous pouvez réessayer.', 'error');
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

refreshBtn.addEventListener('click', loadArticles);
retryBtn.addEventListener('click', loadArticles);

// Premier chargement
loadArticles();