// Les statuts sont stockés en anglais, mais affichés en français
const STATUS_LABELS = {
    available: 'Disponible',
    reserved: 'Réservé',
    sold: 'Vendu'
};

// ----- Les messages (chargement, erreur) -----

// Choisit un titre et un conseil selon le type d'erreur
function describeError(error) {
    if (error.type === 'offline') {
        return {
            title: 'Vous êtes hors-ligne',
            hint: 'Vérifiez votre connexion internet, puis cliquez sur « Réessayer ».'
        };
    }
    if (error.type === 'network') {
        return {
            title: 'Serveur injoignable',
            hint: 'Vérifiez que le serveur est lancé, puis cliquez sur « Réessayer ».'
        };
    }
    if (error.type === 'timeout') {
        return {
            title: 'Le serveur met trop de temps à répondre',
            hint: 'Patientez quelques instants, puis cliquez sur « Réessayer ».'
        };
    }
    if (error.type === 'parse') {
        return {
            title: 'Réponse du serveur illisible',
            hint: 'Le serveur a envoyé des données inattendues. Réessayez plus tard.'
        };
    }
    if (error.type === 'http' && error.status === 404) {
        return {
            title: 'Contenu introuvable (erreur 404)',
            hint: "L'élément demandé n'existe pas. Cliquez sur « Réessayer » pour recharger la liste."
        };
    }
    if (error.type === 'http' && error.status >= 500) {
        return {
            title: 'Erreur du serveur (erreur ' + error.status + ')',
            hint: 'Le problème vient du serveur, pas de votre appareil. Réessayez dans quelques minutes.'
        };
    }
    return {
        title: 'Une erreur est survenue',
        hint: error.message || 'Cliquez sur « Réessayer ».'
    };
}

// Message simple (par exemple : chargement)
export function showStatus(message, withRetry = false) {
    const box = document.getElementById('catalogue-status');
    box.hidden = false;
    box.classList.remove('is-error');
    document.getElementById('catalogue-message').textContent = message;
    document.getElementById('catalogue-hint').hidden = true;
    document.getElementById('catalogue-retry').hidden = !withRetry;
}

// Erreur : titre + conseil + bouton « Réessayer »
export function showError(error) {
    const info = describeError(error);
    const box = document.getElementById('catalogue-status');
    box.hidden = false;
    box.classList.add('is-error');
    document.getElementById('catalogue-message').textContent = info.title;

    const hint = document.getElementById('catalogue-hint');
    hint.textContent = info.hint;
    hint.hidden = false;

    document.getElementById('catalogue-retry').hidden = false;
}

export function hideStatus() {
    document.getElementById('catalogue-status').hidden = true;
}

// ----- Squelette de chargement : 3 fausses cartes grises -----
export function showSkeleton() {
    const container = document.getElementById('catalogue-container');
    container.textContent = '';
    document.getElementById('reset-filters').hidden = true;

    for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.classList.add('skeleton-card');
        container.appendChild(card);
    }
}

// ----- La liste des articles -----

// Fabrique la carte d'un seul article
function createArticleCard(article) {
    const card = document.createElement('div');
    card.classList.add('article-card');

    const title = document.createElement('h3');
    title.textContent = article.title;

    const badge = document.createElement('span');
    badge.classList.add('badge', 'badge-' + article.status);
    badge.textContent = STATUS_LABELS[article.status] || article.status;

    const description = document.createElement('p');
    description.classList.add('article-description');
    description.textContent = article.description;

    const price = document.createElement('p');
    price.classList.add('article-price');
    price.textContent = article.price.toLocaleString('fr-FR') + ' MAD';

    const date = document.createElement('p');
    date.classList.add('article-date');
    date.textContent = 'Ajouté le ' + new Date(article.createdAt).toLocaleDateString('fr-FR');

    // Boutons : modifier (PUT) et supprimer
    const actions = document.createElement('div');
    actions.classList.add('article-actions');

    const editButton = document.createElement('button');
    editButton.textContent = 'Modifier';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = article.id;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer';
    deleteButton.classList.add('btn-danger');
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = article.id;

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    // Changement rapide (PATCH) : le statut ou le prix seulement
    const quick = document.createElement('div');
    quick.classList.add('quick-edit');

    const statusSelect = document.createElement('select');
    statusSelect.dataset.action = 'status';
    statusSelect.dataset.id = article.id;
    statusSelect.setAttribute('aria-label', 'Statut de ' + article.title);
    Object.keys(STATUS_LABELS).forEach(function (key) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = STATUS_LABELS[key];
        statusSelect.appendChild(option);
    });
    statusSelect.value = article.status;

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.step = '0.01';
    priceInput.value = article.price;
    priceInput.classList.add('price-input');
    priceInput.setAttribute('aria-label', 'Nouveau prix de ' + article.title);

    const priceButton = document.createElement('button');
    priceButton.textContent = 'Changer le prix';
    priceButton.dataset.action = 'price';
    priceButton.dataset.id = article.id;

    quick.appendChild(statusSelect);
    quick.appendChild(priceInput);
    quick.appendChild(priceButton);

    card.appendChild(title);
    card.appendChild(badge);
    card.appendChild(description);
    card.appendChild(price);
    card.appendChild(date);
    card.appendChild(actions);
    card.appendChild(quick);
    return card;
}

// Dessine toute la liste (une carte par article)
export function renderArticles(articles, hasFilters) {
    const container = document.getElementById('catalogue-container');
    const resetButton = document.getElementById('reset-filters');
    container.textContent = '';

    // Liste vide : deux cas différents
    if (articles.length === 0) {
        const empty = document.createElement('p');
        empty.classList.add('empty-message');

        if (hasFilters) {
            empty.textContent = 'Aucun article ne correspond à votre recherche.';
            resetButton.hidden = false;
        } else {
            empty.textContent = 'Aucun article dans le catalogue.';
            resetButton.hidden = true;
        }

        container.appendChild(empty);
        return;
    }

    resetButton.hidden = true;
    articles.forEach(function (article) {
        container.appendChild(createArticleCard(article));
    });
}

// Vide la liste (utilisé quand il y a une erreur)
export function clearList() {
    document.getElementById('catalogue-container').textContent = '';
    document.getElementById('reset-filters').hidden = true;
}

// ----- Message après une action (type : 'success', 'error' ou 'info') -----
let messageTimer;

export function showActionMessage(text, type) {
    const box = document.getElementById('action-message');
    box.textContent = text;
    box.className = 'action-message ' + type;
    box.hidden = false;

    clearTimeout(messageTimer);
    if (type === 'success') {
        // Le message de succès disparaît seul après 4 secondes
        messageTimer = setTimeout(function () {
            box.hidden = true;
        }, 4000);
    }
}

// ----- Bandeau "données hors-ligne" -----

export function showOfflineBanner(timestamp) {
    const banner = document.getElementById('offline-banner');
    banner.textContent = 'Données du ' + new Date(timestamp).toLocaleString('fr-FR') + ' (hors-ligne)';
    banner.hidden = false;
}

export function hideOfflineBanner() {
    document.getElementById('offline-banner').hidden = true;
}