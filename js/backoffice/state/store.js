// L'état de l'application : la liste, et ce que l'utilisateur a choisi
export const state = {
    articles: [],
    search: '',
    status: 'all',
    sort: 'date-desc'
};

// ----- La liste des articles -----

export function setArticles(list) {
    state.articles = list;
}

// Ajoute un article en tête de liste
export function addArticle(article) {
    state.articles.unshift(article);
}

// Retire un article de la liste
export function removeArticle(id) {
    state.articles = state.articles.filter(function (article) {
        return article.id !== id;
    });
}

// Remet un article à sa place (si le serveur a refusé la suppression)
export function restoreArticle(article, index) {
    state.articles.splice(index, 0, article);
}

// Remplace un article par sa nouvelle version (même id)
export function replaceInState(updated) {
    state.articles = state.articles.map(function (article) {
        if (article.id === updated.id) {
            return updated;
        }
        return article;
    });
}

// ----- Recherche, filtre et tri -----

export function setSearch(text) {
    state.search = text;
}

export function setStatus(status) {
    state.status = status;
}

export function setSort(sort) {
    state.sort = sort;
}

// Remet la recherche, le filtre et le tri à zéro
export function resetFilters() {
    state.search = '';
    state.status = 'all';
    state.sort = 'date-desc';
}

// Y a-t-il une recherche ou un filtre en cours ?
export function hasActiveFilters() {
    return state.search.trim() !== '' || state.status !== 'all';
}

// Renvoie la liste à afficher : recherche + filtre + tri
export function getVisibleArticles() {
    const search = state.search.trim().toLowerCase();

    const result = state.articles.filter(function (article) {
        const matchesSearch = article.title.toLowerCase().includes(search);
        const matchesStatus = state.status === 'all' || article.status === state.status;
        return matchesSearch && matchesStatus;
    });

    result.sort(function (a, b) {
        if (state.sort === 'title-asc') {
            return a.title.localeCompare(b.title, 'fr');
        }
        if (state.sort === 'price-asc') {
            return a.price - b.price;
        }
        if (state.sort === 'price-desc') {
            return b.price - a.price;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
}