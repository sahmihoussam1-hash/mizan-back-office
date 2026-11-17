// 1. L'adresse de base : la seule chose à changer si le serveur change
const BASE_URL = 'http://localhost:3001';

// 3. Le délai maximum : 8 secondes
const TIMEOUT_MS = 8000;

// 6. Fabrique une erreur toujours de la même forme
function makeError(type, status, message) {
    return { type: type, status: status, message: message };
}

// Choisit le message selon le code HTTP

function getHttpMessage(status) {
    if (status === 404) {
        return 'Élément introuvable (erreur 404).';
    }
    if (status === 429) {
        return 'Quota dépassé : trop de requêtes.';
    }
    if (status >= 500) {
        return 'Le serveur a un problème (erreur ' + status + ').';
    }
    return 'Requête refusée (erreur ' + status + ').';
}

// La seule fonction qui parle au réseau.
// path = '/articles' ; options = { method: 'POST', body: { ... } }
export async function request(path, options = {}) {
    // 7. Pas d'internet ?
    if (!navigator.onLine) {
        throw makeError('offline', null, 'Vous êtes hors-ligne.');
    }

    // 2. Les en-têtes JSON
    const headers = { 'Accept': 'application/json' };
    const config = {
        method: options.method || 'GET',
        headers: headers
    };
    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(options.body);
    }

    // 3. Le chronomètre : après 8 secondes, on annule la requête
    const controller = new AbortController();
    config.signal = controller.signal;
    const timer = setTimeout(function () {
        controller.abort();
    }, TIMEOUT_MS);

    // On accepte aussi une adresse complète (ex : une autre API)
    let url = BASE_URL + path;
    if (path.startsWith('http')) {
        url = path;
    }

    // On envoie la requête et on lit la réponse sous forme de texte
    let response;
    let text;
    try {
        response = await fetch(url, config);
        text = await response.text();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw makeError('timeout', null, 'Le serveur met trop de temps à répondre.');
        }
        throw makeError('network', null, 'Erreur réseau : le serveur est injoignable.');
    } finally {
        clearTimeout(timer);   // dans tous les cas, on arrête le chronomètre
    }

    // 4. Le serveur a répondu avec une erreur (4xx ou 5xx)
    if (!response.ok) {
        throw makeError('http', response.status, getHttpMessage(response.status));
    }

    // 5. Corps vide (par exemple après un DELETE) : rien à lire
    if (text === '') {
        return null;
    }

    // 5. Sinon, on transforme le texte en objet
    try {
        return JSON.parse(text);
    } catch (error) {
        throw makeError('parse', response.status, 'Réponse illisible.');
    }
}