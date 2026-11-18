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
        button.textContent = "Ajouter l'article";
    }
}

// Vide le formulaire et ferme le bloc
export function resetForm() {
    document.getElementById('article-form').reset();
    showFieldErrors({});
    document.getElementById('form-section').open = false;
}