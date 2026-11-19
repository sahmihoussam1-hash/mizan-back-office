// Le formulaire sert à créer ET à modifier
let editing = false;

function getSubmitLabel() {
    if (editing) {
        return 'Enregistrer les modifications';
    }
    return "Ajouter l'article";
}

// Lit ce que l'utilisateur a écrit dans le formulaire
export function readForm() {
    return {
        title: document.getElementById('article-title').value,
        description: document.getElementById('article-description').value,
        price: document.getElementById('article-price').value,
        status: document.getElementById('article-status').value
    };
}

// Affiche un message sous chaque champ invalide (et efface les autres)
export function showFieldErrors(errors) {
    ['title', 'description', 'price'].forEach(function (field) {
        document.getElementById(field + '-error').textContent = errors[field] || '';
    });
}

// Pendant l'envoi : bouton bloqué et indicateur visible
export function setFormBusy(busy) {
    const button = document.getElementById('article-submit');
    button.disabled = busy;
    button.classList.toggle('loading', busy);
    if (busy) {
        button.textContent = 'Envoi en cours...';
    } else {
        button.textContent = getSubmitLabel();
    }
}

// Passe en mode "modifier" : le formulaire est rempli avec l'article
export function startEditing(article) {
    editing = true;

    document.getElementById('article-title').value = article.title;
    document.getElementById('article-description').value = article.description;
    document.getElementById('article-price').value = article.price;
    document.getElementById('article-status').value = article.status;
    showFieldErrors({});

    document.getElementById('form-title').textContent = "Modifier l'article";
    document.getElementById('article-submit').textContent = getSubmitLabel();
    document.getElementById('article-cancel').hidden = false;

    const section = document.getElementById('form-section');
    section.open = true;
    section.scrollIntoView({ behavior: 'smooth' });
}

// Vide le formulaire, revient au mode "ajouter" et ferme le bloc
export function resetForm() {
    editing = false;

    document.getElementById('article-form').reset();
    showFieldErrors({});

    document.getElementById('form-title').textContent = 'Ajouter un article';
    document.getElementById('article-submit').textContent = getSubmitLabel();
    document.getElementById('article-cancel').hidden = true;
    document.getElementById('form-section').open = false;
}