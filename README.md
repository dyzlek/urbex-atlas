# Urbex Atlas

Carte collaborative de spots d'exploration urbaine : usines, hôpitaux, châteaux abandonnés…
On crée un compte, on ajoute des lieux sur la carte, on indique leur état (accessible, muré, démoli…)
et on discute de chaque spot dans un chat en temps réel. Sans compte, on peut tout consulter mais rien écrire.

## Lancer le projet

```bash
npm run install:all
```

```bash
npm run dev
```

Puis ouvrir http://localhost:5180. Cette commande lance le serveur (port 3001) et le client (port 5180).

Il faut Node 22.13 ou plus récent (la base SQLite utilise le module `node:sqlite` intégré à Node).

Les données sont dans une base SQLite, `server/urbex.db`. Elle est créée et remplie avec `server/data.seed.json`
au premier lancement. Pour remettre les données de départ, arrête le serveur et supprime `server/urbex.db`.

## Technologies

- **Client** : React 18, Vite, React Router, React-Leaflet (OpenStreetMap), socket.io-client
- **Serveur** : Node.js, Express (API REST), Socket.io (temps réel), base SQLite (`node:sqlite`),
  comptes avec bcryptjs (hachage des mots de passe) et jsonwebtoken (jetons JWT)

## Structure

```
server/
  index.js          comptes, API REST (spots, favoris) + Socket.io (chat par spot, mises à jour en direct)
  db.js             base SQLite : création des tables, données de départ
  data.seed.json    données de départ
client/src/
  main.jsx          point d'entrée : BrowserRouter + SpotsProvider
  App.jsx           barre de navigation + routes
  api.js            appels fetch au serveur (avec le jeton), connexion Socket.io, recherche Nominatim
  constantes.js     catégories, états, couleurs
  context/AuthContext.jsx    utilisateur connecté, connexion / inscription / déconnexion
  context/SpotsContext.jsx   état global : spots, favoris du compte
  pages/
    CartePage.jsx   carte, ajout / modification / suppression dans les popups
    ListePage.jsx   liste filtrable, favoris
    DetailPage.jsx  fiche d'un spot + chat en direct
    StatsPage.jsx   tableau de bord
    ConnexionPage.jsx  connexion et inscription
  components/
    MapClick.jsx    useMapEvents : clic sur la carte -> nouveau spot
    FlyTo.jsx       useMap : déplace la carte vers une position
    SearchBar.jsx   recherche d'adresse (Nominatim)
    LocateButton.jsx  géolocalisation (navigator.geolocation)
    SpotForm.jsx    formulaire d'ajout et de modification
    Chat.jsx        chat Socket.io d'un spot
    icones.js       marqueurs colorés (L.divIcon)
```

## Où trouver chaque exigence du sujet

| Exigence | Où |
|---|---|
| Plusieurs pages (React Router) | `App.jsx` : `/`, `/spots`, `/spots/:id`, `/stats` ; `useParams` dans `DetailPage`, `useNavigate` + `state` pour « Voir sur la grande carte » |
| Composant perso `useMapEvents` | `components/MapClick.jsx` |
| Composant perso `useMap` | `components/FlyTo.jsx` |
| Géolocalisation native | `components/LocateButton.jsx` |
| Recherche d'adresse (API externe) | `components/SearchBar.jsx` + `rechercherAdresse` dans `api.js` |
| Ajout avec popup et formulaire | `CartePage.jsx` (clic sur la carte -> popup avec `SpotForm`) |
| Modification et suppression | popups de `CartePage.jsx`, boutons de `DetailPage.jsx`, routes `PUT` / `DELETE` dans `server/index.js` |
| Comptes et base de données (en plus) | `server/db.js` (tables `users`, `spots`, `messages`, `favoris`), routes `/api/auth/*` et middleware `connecte` dans `server/index.js`, `context/AuthContext.jsx` |
| Animations (en plus) | fin de `style.css` : entrée des pages, cartes en cascade, marqueurs qui tombent, popups, barres des stats |
| Collaboratif en temps réel | `components/Chat.jsx` (un salon Socket.io par spot) + événement `spots:update` : la carte, la liste et les stats se mettent à jour chez tout le monde |

## Comment circulent les données

1. Au démarrage, `AuthContext` vérifie le jeton gardé dans le localStorage (`GET /api/auth/moi`),
   et `SpotsContext` charge les spots avec `GET /api/spots`.
2. Un ajout, une modification ou une suppression passe par l'API REST (`POST`, `PUT`, `DELETE`), avec l'en-tête
   `Authorization: Bearer <jeton>`. Le serveur refuse sans jeton (401) et si on n'est pas l'auteur du spot (403).
3. Après chaque changement, le serveur écrit dans la base et envoie `spots:update` à **tous** les clients
   connectés. Le contexte remplace alors sa liste, et toutes les pages se mettent à jour.
4. Pour le chat, la page d'un spot rejoint le salon du spot (`chat:join`) et reçoit l'historique.
   Le jeton est envoyé à la connexion Socket.io : l'auteur d'un message est lu dans le jeton, pas dans ce que le
   client envoie. Un message (`chat:send`) est enregistré, puis renvoyé à tous les membres du salon (`chat:message`).

## Comptes

- Le mot de passe n'est jamais stocké : seulement son hachage bcrypt (`bcrypt.hashSync`, vérifié avec `compareSync`).
- À la connexion, le serveur renvoie un jeton JWT signé avec une clé secrète (valable 7 jours). Le client le garde
  dans le localStorage et l'envoie à chaque requête. Personne ne peut fabriquer ou modifier un jeton sans la clé.
- En ligne, définir la variable d'environnement `JWT_SECRET` sur Render (sinon une clé de dev est utilisée).
- Les spots de départ n'ont pas d'auteur inscrit : personne ne peut les modifier. Pour la démo, crée un spot avec ton compte.

Pour tester le temps réel en démo : ouvrir l'appli dans deux fenêtres côte à côte.

## Soutenance du 1/12 : points de vigilance

- **Render gratuit** : le service s'endort après 15 min et la base `urbex.db` (comptes compris) est effacée à chaque
  redémarrage. Ouvrir l'appli quelques minutes avant le passage, recréer son compte, et ne pas compter sur des spots
  ajoutés la veille.
- **Démo du temps réel** : deux fenêtres côte à côte suffisent (voir plus haut).
- **Questions sur le code** : savoir expliquer
  - le `key` sur le marqueur du nouveau point (le bug du formulaire qui ne se rouvrait pas : sans `key`, React déplace
    le marqueur au lieu de le recréer, donc sa popup ne se rouvre pas) ;
  - le test au début de `MapClick` : un clic sur un bouton de la popup remonte jusqu'à la carte et créait un nouveau
    point. Pour Annuler, React a déjà retiré le bouton de la page quand la carte reçoit le clic, d'où le test
    `map.getContainer().contains(cible)` en plus de `closest(".leaflet-popup")` ;
  - le choix des salons Socket.io : un salon par spot (`socket.join(spotId)`), pour qu'un message n'aille qu'aux
    personnes qui regardent ce spot (`io.to(spotId).emit`), alors que `spots:update` est envoyé à tout le monde (`io.emit`).
    Après une reconnexion, le serveur a oublié les salons : `Chat.jsx` rejoint à nouveau le salon à chaque `connect` ;
  - pourquoi le serveur vérifie l'auteur (403) alors que le client cache déjà les boutons : cacher un bouton ne protège
    rien, n'importe qui peut envoyer une requête à la main ;
  - les clés étrangères avec `ON DELETE CASCADE` : supprimer un spot supprime ses messages et ses favoris.
