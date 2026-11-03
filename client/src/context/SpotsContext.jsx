// État global de l'appli : la liste des spots, les favoris et le pseudo.
// Tous les composants y accèdent avec le hook useSpots().
import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

const SpotsContext = createContext(null);

// Lit une valeur dans le localStorage (avec une valeur par défaut)
function lireLocal(cle, defaut) {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur ? JSON.parse(valeur) : defaut;
  } catch {
    return defaut;
  }
}

export function SpotsProvider({ children }) {
  const [spots, setSpots] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [favoris, setFavoris] = useState(() => lireLocal("favoris", []));
  const [pseudo, setPseudo] = useState(() => lireLocal("pseudo", ""));

  // 1er chargement par l'API, puis mises à jour en direct par Socket.io
  useEffect(() => {
    api
      .getSpots()
      .then(setSpots)
      .catch(() => setErreur("Impossible de joindre le serveur"))
      .finally(() => setChargement(false));

    api.socket.on("spots:update", setSpots);
    return () => api.socket.off("spots:update", setSpots);
  }, []);

  // On garde les favoris et le pseudo d'une visite à l'autre
  useEffect(() => localStorage.setItem("favoris", JSON.stringify(favoris)), [favoris]);
  useEffect(() => localStorage.setItem("pseudo", JSON.stringify(pseudo)), [pseudo]);

  function basculerFavori(id) {
    setFavoris((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  // Les fonctions CRUD n'ont pas besoin de modifier "spots" elles-mêmes :
  // le serveur renvoie la nouvelle liste à tout le monde avec "spots:update".
  const valeur = {
    spots,
    chargement,
    erreur,
    favoris,
    basculerFavori,
    pseudo,
    setPseudo,
    ajouterSpot: (spot) => api.createSpot({ ...spot, auteur: pseudo || "Anonyme" }),
    modifierSpot: api.updateSpot,
    supprimerSpot: api.deleteSpot,
  };

  return <SpotsContext.Provider value={valeur}>{children}</SpotsContext.Provider>;
}

export function useSpots() {
  return useContext(SpotsContext);
}
