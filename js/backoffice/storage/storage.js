// Le nom du carnet : "v1" = version 1 des données
const CACHE_KEY = 'catalogue:v1:items';

// Durée de vie du carnet : 5 minutes (en millisecondes)
const TTL_MS = 5 * 60 * 1000;

// ÉCRIRE : on range la liste avec l'heure actuelle
export function saveCache(items) {
    const entry = { savedAt: Date.now(), items: items };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch (error) {
        console.warn('Cache impossible à enregistrer :', error.message);
    }
}

// LIRE : on renvoie { savedAt, items }, ou null s'il n'y a rien d'utilisable
export function readCache() {
    const raw = localStorage.getItem(CACHE_KEY);

    if (raw === null) {
        return null;   // le carnet est vide
    }

    try {
        const entry = JSON.parse(raw);
        // On vérifie que le carnet a la bonne forme
        if (typeof entry.savedAt !== 'number' || !Array.isArray(entry.items)) {
            throw new Error('Cache invalide');
        }
        return entry;
    } catch (error) {
        // Carnet illisible : on l'ignore et on le supprime
        console.warn('Cache illisible, il est ignoré.');
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

// FRAÎCHEUR : le carnet a-t-il moins de 5 minutes ?
export function isFresh(entry) {
    return Date.now() - entry.savedAt < TTL_MS;
}
const PREFS_KEY = 'mizan_backoffice_prefs_v1';

const DEFAULT_PREFS = {
    status: 'all',
    sort: 'date-desc',
    theme: 'dark'
};

export function savePrefs(prefs) {
    try {
        const current = readPrefs();
        const updated = { ...current, ...prefs };
        localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch {
        // Ignore les erreurs de quota ou navigation privée
    }
}

export function readPrefs() {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return { ...DEFAULT_PREFS };
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) {
            return { ...DEFAULT_PREFS };
        }
        return {
            status: parsed.status || DEFAULT_PREFS.status,
            sort: parsed.sort || DEFAULT_PREFS.sort,
            theme: parsed.theme === 'light' ? 'light' : 'dark'
        };
    } catch {
        return { ...DEFAULT_PREFS };
    }
}