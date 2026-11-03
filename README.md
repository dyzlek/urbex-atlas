# Urbex Atlas

Carte collaborative de spots d'exploration urbaine : usines, hôpitaux, châteaux abandonnés…
On ajoute des lieux sur la carte, on indique leur état (accessible, muré, démoli…) et on discute
de chaque spot dans un chat en temps réel.

## Lancer le projet

```bash
npm run install:all
```

```bash
npm run dev
```

Puis ouvrir http://localhost:5180. Cette commande lance le serveur (port 3001) et le client (port 5180).

Les données sont enregistrées dans `server/data.json`. Ce fichier est créé à partir de `server/data.seed.json`
au premier lancement. Pour remettre les données de départ, supprime `server/data.json`.

## Technologies

- **Client** : React 18, Vite, React Router, React-Leaflet (OpenStreetMap), socket.io-client
- **Serveur** : Node.js, Express (API REST), Socket.io (temps réel), stockage dans un fichier JSON

## Structure

```
server/
  index.js          API REST (CRUD des spots) + Socket.io (chat par spot, mises à jour en direct)
  data.seed.json    données de départ
client/src/
  main.jsx          point d'entrée : BrowserRouter + SpotsProvider
  App.jsx           barre de navigation + routes
  api.js            appels fetch au serveur, connexion Socket.io, recherche Nominatim
  constantes.js     catégories, états, couleurs
  context/SpotsContext.jsx   état global : spots, favoris, pseudo
  pages/
    CartePage.jsx   carte, ajout / modification / suppression dans les popups
    ListePage.jsx   liste filtrable, favoris
    DetailPage.jsx  fiche d'un spot + chat en direct
    StatsPage.jsx   tableau de bord
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
| Collaboratif en temps réel | `components/Chat.jsx` (un salon Socket.io par spot) + événement `spots:update` : la carte, la liste et les stats se mettent à jour chez tout le monde |

## Comment circulent les données

1. Au démarrage, `SpotsContext` charge les spots avec `GET /api/spots`.
2. Un ajout, une modification ou une suppression passe par l'API REST (`POST`, `PUT`, `DELETE`).
3. Après chaque changement, le serveur sauvegarde le fichier JSON et envoie `spots:update` à **tous** les clients
   connectés. Le contexte remplace alors sa liste, et toutes les pages se mettent à jour.
4. Pour le chat, la page d'un spot rejoint le salon du spot (`chat:join`) et reçoit l'historique.
   Un message (`chat:send`) est enregistré, puis renvoyé à tous les membres du salon (`chat:message`).

Pour tester le temps réel en démo : ouvrir l'appli dans deux fenêtres côte à côte.

## Soutenance du 1/12 : points de vigilance

- **Render gratuit** : le service s'endort après 15 min et `data.json` est effacé à chaque redémarrage. Ouvrir l'appli
  quelques minutes avant le passage, et ne pas compter sur des spots ajoutés la veille.
- **Démo du temps réel** : deux fenêtres côte à côte suffisent (voir plus haut).
- **Questions sur le code** : savoir expliquer
  - le `key` sur le marqueur du nouveau point (le bug du formulaire qui ne se rouvrait pas : sans `key`, React déplace
    le marqueur au lieu de le recréer, donc sa popup ne se rouvre pas) ;
  - le test `closest(".leaflet-popup")` dans `MapClick` (un clic sur un bouton de la popup remonte jusqu'à la carte et
    créait un nouveau point) ;
  - le choix des salons Socket.io : un salon par spot (`socket.join(spotId)`), pour qu'un message n'aille qu'aux
    personnes qui regardent ce spot (`io.to(spotId).emit`), alors que `spots:update` est envoyé à tout le monde (`io.emit`).
