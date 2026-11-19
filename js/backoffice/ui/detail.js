import { describeError, STATUS_LABELS } from './display.js';

// Ajoute une ligne "étiquette : valeur" dans la fenêtre
function addRow(parent, label, value) {
    const row = document.createElement('p');
    row.classList.add('detail-row');

    const labelElement = document.createElement('span');
    labelElement.classList.add('detail-label');
    labelElement.textContent = label;

    const valueElement = document.createElement('span');
    valueElement.classList.add('detail-value');
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    parent.appendChild(row);
}

// ----- Les 3 états de la fenêtre -----

// CHARGEMENT
export function showDetailLoading() {
    const body = document.getElementById('detail-body');
    body.textContent = '';

    const message = document.createElement('p');
    message.classList.add('detail-loading');
    message.textContent = "Chargement de l'article...";
    body.appendChild(message);

    document.getElementById('detail-retry').hidden = true;
}

// SUCCÈS
export function showDetailArticle(article) {
    const body = document.getElementById('detail-body');
    body.textContent = '';

    addRow(body, 'Titre', article.title);
    addRow(body, 'Statut', STATUS_LABELS[article.status] || article.status);
    addRow(body, 'Prix', article.price.toLocaleString('fr-FR') + ' MAD');
    addRow(body, 'Description', article.description);
    addRow(body, "Date d'ajout", new Date(article.createdAt).toLocaleString('fr-FR'));
    addRow(body, 'Référence', '#' + article.id);

    document.getElementById('detail-retry').hidden = true;
}

// ERREUR
export function showDetailError(error) {
    const info = describeError(error);
    const body = document.getElementById('detail-body');
    body.textContent = '';

    const title = document.createElement('p');
    title.classList.add('detail-error-title');
    title.textContent = info.title;

    const hint = document.createElement('p');
    hint.textContent = info.hint;

    body.appendChild(title);
    body.appendChild(hint);

    document.getElementById('detail-retry').hidden = false;
}

// ----- Ouvrir et fermer -----

export function openDetail() {
    document.getElementById('detail-overlay').hidden = false;
    showDetailLoading();
}

function closeDetail(onClose) {
    document.getElementById('detail-overlay').hidden = true;
    onClose();
}

// Branche les boutons (appelé une seule fois au démarrage)
export function initDetail(onRetry, onClose) {
    const overlay = document.getElementById('detail-overlay');

    document.getElementById('detail-close').addEventListener('click', function () {
        closeDetail(onClose);
    });

    document.getElementById('detail-retry').addEventListener('click', onRetry);

    // Clic à côté de la fenêtre
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
            closeDetail(onClose);
        }
    });

    // Touche Échap
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !overlay.hidden) {
            closeDetail(onClose);
        }
    });
}