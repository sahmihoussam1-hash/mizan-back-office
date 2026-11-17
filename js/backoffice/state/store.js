// L'état de l'application : la liste, et ce que l'utilisateur a choisi
export const state = {
    articles: [],
    search: '',
    status: 'all',
    sort: 'date-desc'
};

export function setArticles(list) {
    state.articles = list;
}

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

    // 1 et 2. On garde les articles qui correspondent à la recherche ET au statut
    const result = state.articles.filter(function (article) {
        const matchesSearch = article.title.toLowerCase().includes(search);
        const matchesStatus = state.status === 'all' || article.status === state.status;
        return matchesSearch && matchesStatus;
    });

    // 3. On trie (filter a déjà créé une copie : la liste d'origine ne bouge pas)
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
        // par défaut : les plus récents d'abord
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
}