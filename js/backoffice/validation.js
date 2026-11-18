// Vérifie les données du formulaire.
// Renvoie un objet avec un message par champ invalide.
// Objet vide = tout est bon.
export function validateArticle(data) {
    const errors = {};

    const title = data.title.trim();
    if (title.length < 3 || title.length > 80) {
        errors.title = 'Le titre doit contenir entre 3 et 80 caractères.';
    }

    if (data.description.trim().length < 10) {
        errors.description = 'La description doit contenir au moins 10 caractères.';
    }

    const price = Number(data.price);
    if (data.price.trim() === '' || isNaN(price) || price <= 0) {
        errors.price = 'Le prix doit être un nombre supérieur à 0.';
    }

    return errors;
}