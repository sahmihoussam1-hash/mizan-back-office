# Mizan — Bijouterie Al Andalous (Nador)

Application web développée en **HTML5, CSS3 et JavaScript natif (Vanilla JS)** pour la bijouterie **Al Andalous** à Nador.

Le projet est composé de **deux pages** qui partagent la même charte graphique :
1. **`index.html` (Mizan 1 — Cours & Estimateur)** : Consultation des cours de l'or et de l'argent en temps réel, conversion de devises (`MAD`, `USD`, `EUR`), graphique d'historique et estimateur de prix selon le poids en grammes.
2. **`catalogue.html` (Mizan 2 — Back-office CRUD)** : Gestion du catalogue d'articles de la bijouterie avec création, lecture, modification, suppression, mode hors-ligne et sauvegarde des préférences.

---

## Fonctionnalités du Back-office (`catalogue.html`)

- **Consultation (`GET`)** : Affichage des articles, recherche par mot-clé, filtre par statut (`Disponible`, `Réservé`, `Vendu`), tri par date ou par prix, et modale de détail (`GET /posts/:id`).
- **Création (`POST`)** : Formulaire d'ajout avec validation des champs (titre, description, prix positif, statut) et messages d'erreur clairs.
- **Modification complète (`PUT`) & rapide (`PATCH`)** :
  - Édition complète d'un article via le formulaire principal (`PUT`).
  - Modification rapide du statut ou du prix directement sur la carte (`PATCH`).
- **Suppression (`DELETE`)** : Confirmation via une fenêtre modale personnalisée (sans `window.confirm`), suppression immédiate à l'écran (mise à jour optimiste) et restauration automatique de l'article si la requête échoue.
- **États d'interface visibles** : Squelettes de chargement (*skeleton*), état vide avec bouton de réinitialisation des filtres, et état d'erreur avec bouton « Réessayer ».
- **Cache et mode hors-ligne (`localStorage`)** : Sauvegarde du catalogue pendant 5 minutes (TTL) pour limiter les appels réseau et permettre la consultation même sans connexion internet.
- **Préférences utilisateur** : Mémorisation automatique du filtre de statut et de l'ordre de tri au rechargement de la page.

---

## Architecture du code

Pour garder un code propre et facile à maintenir, le JavaScript du back-office est découpé en **modules ES (`import` / `export`)** selon le rôle de chaque fichier :

```text
mizan-back-office/
├── index.html                  # Page 1 : Cours des métaux et estimateur
├── catalogue.html              # Page 2 : Back-office CRUD du catalogue
├── css/
│   └── style.css               # Feuille de style unique avec variables CSS
└── js/
    ├── api.js, calculator.js... # Modules de la page 1 (Mizan 1)
    └── backoffice/             # Modules de la page 2 (Mizan 2)
        ├── app.js              # Chef d'orchestre (événements et coordination)
        ├── validation.js       # Vérification des données du formulaire
        ├── services/
        │   ├── apiClient.js    # Fonction unique request() avec timeout (8s) et gestion d'erreurs
        │   └── catalogueApi.js # Appels CRUD (GET, POST, PUT, PATCH, DELETE)
        ├── storage/
        │   └── storage.js      # Gestion du cache (TTL 5 min) et des préférences (localStorage)
        ├── state/
        │   └── store.js        # État local en mémoire (source de vérité pour l'affichage)
        └── ui/
            ├── display.js      # Création sécurisée des cartes et états d'interface
            ├── form.js         # Lecture et pré-remplissage du formulaire
            ├── modals.js       # Modale de confirmation maison
            └── detail.js       # Modale d'affichage du détail d'un article