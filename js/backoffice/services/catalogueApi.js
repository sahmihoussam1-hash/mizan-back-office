import { request } from './apiClient.js';

// Lire la liste de tous les articles
export function getArticles() {
    return request('/articles');
}

// Lire un seul article
export function getArticle(id) {
    return request('/articles/' + id);
}

// Créer un article
export function createArticle(article) {
    return request('/articles', { method: 'POST', body: article });
}

// Remplacer tout l'article (PUT)
export function replaceArticle(id, article) {
    return request('/articles/' + id, { method: 'PUT', body: article });
}

// Modifier seulement quelques champs (PATCH)
export function patchArticle(id, changes) {
    return request('/articles/' + id, { method: 'PATCH', body: changes });
}

// Supprimer un article
export function deleteArticle(id) {
    return request('/articles/' + id, { method: 'DELETE' });
}