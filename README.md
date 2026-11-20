
---

## Lancer le projet

1. Ouvrir le dossier dans VS Code.
2. Démarrer l'API de test dans un terminal dédié (à laisser ouvert) :

```bash
npx json-server@0.17.4 --watch server/db.json --port 3002
```

3. Ouvrir `index.html` ou `catalogue.html` avec Live Server.

L'adresse de base du serveur est une constante (`BASE_URL`) en haut de `js/backoffice/services/apiClient.js` : c'est la seule ligne à modifier pour viser une autre API.

---

## Captures d'écran

### Liste des articles et formulaire
![Liste des articles](screenshots/01-liste.png)

### État de chargement (squelette)
![État de chargement](screenshots/02-chargement.png)

### Mode hors-ligne (données lues depuis le cache)
![Mode hors-ligne](screenshots/03-offline.png)

### État vide et état d'erreur
![État vide ou erreur](screenshots/04-erreur-ou-vide.png)

---

## Différence entre PUT et PATCH

| | PUT | PATCH |
|---|---|---|
| Ce qu'on envoie | **tous** les champs de l'article | **seulement** les champs à modifier |
| Champ oublié | perdu : la ressource est remplacée | inchangé |
| Idempotence | oui : répéter la même requête donne le même résultat | oui dans notre usage (on fixe une valeur, par exemple `status: "sold"`) |
| Usage dans l'application | bouton « Modifier » : formulaire pré-rempli, même validation que la création | changement rapide du statut ou du prix depuis la carte |

À titre de comparaison, `POST` n'est **pas** idempotent : chaque envoi crée un nouvel article.

---

## Stratégie de cache

- Chaque `GET` réussi de la liste est stocké dans `localStorage` sous la clé versionnée `catalogue:v1:items`, avec l'heure d'enregistrement.
- **TTL de 5 minutes** : un cache plus récent est utilisé sans appeler le serveur.
- Si le serveur est injoignable (hors-ligne, réseau, délai dépassé, erreur 5xx) et qu'un cache existe, la liste s'affiche avec le bandeau « Données du … (hors-ligne) ». Une erreur 404 ou 4xx n'est pas une panne : le cache n'est pas utilisé dans ce cas.
- Le bouton « Rafraîchir » force l'appel réseau.
- Après chaque ajout, modification ou suppression réussi, le cache est mis à jour avec la liste locale.
- Un cache illisible ne fait jamais planter l'application : il est ignoré, supprimé, puis remplacé au chargement suivant.
- Si la forme des données change, il suffit de passer à `catalogue:v2:items` : l'ancien cache est alors ignoré.

---

## Difficultés rencontrées

| Problème | Cause | Solution |
|---|---|---|
| Erreur `426 Upgrade Required` et fausse erreur CORS | l'aperçu VS Code (Live Preview) occupait le port 3001 de json-server | json-server déplacé sur le port 3002 |
| La page se rechargeait en boucle pendant les tests | Live Server détectait chaque écriture dans `db.json` | dossier `server/` exclu de la surveillance de Live Server |
| Page entièrement vide, sans message | un `import` pointait vers une fonction absente d'un `export` : le module ne démarre pas | vérification des exports de chaque fichier, avec la console du navigateur |
| Liste des articles sortie de la colonne centrée | une balise `</div>` en trop fermait le `container` trop tôt | balise supprimée, doublons d'`id` retirés |
| Erreur 404 sur une modification | la liste affichée était périmée : l'article n'existait plus sur le serveur | en cas de 404, la liste est rechargée automatiquement |

---

## Limites et pistes d'amélioration

- **US-09 (bonus) — Panneau réseau repliable** : affichage des dernières requêtes (méthode, URL, statut, durée en millisecondes). Non implémenté.
- Le détail d'un article n'est pas mis en cache : il passe toujours par le réseau.