// État global de l'appli : la liste des spots et les favoris de l'utilisateur connecté.
// Tous les composants y accèdent avec le hook useSpots().
import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";
import { useAuth } from "./AuthContext";

const SpotsContext = createContext(null);

export function SpotsProvider({ children }) {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [favoris, setFavoris] = useState([]);

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

  // Les favoris sont enregistrés en base, par compte : on les recharge à chaque connexion
  useEffect(() => {
    if (!user) {
      setFavoris([]);
      return;
    }
    api.getFavoris().then(setFavoris).catch(() => setFavoris([]));
  }, [user]);

  async function basculerFavori(id) {
    if (!user) return;
    if (favoris.includes(id)) {
      setFavoris((f) => f.filter((x) => x !== id));
      await api.retirerFavori(id);
    } else {
      setFavoris((f) => [...f, id]);
      await api.ajouterFavori(id);
    }
  }

  // Les fonctions CRUD n'ont pas besoin de modifier "spots" elles-mêmes :
  // le serveur renvoie la nouvelle liste à tout le monde avec "spots:update".
  const valeur = {
    spots,
    chargement,
    erreur,
    favoris,
    basculerFavori,
    // l'utilisateur connecté peut-il modifier ce spot ? (le serveur vérifie aussi)
    estAuteur: (spot) => !!user && spot.auteurId === user.id,
    ajouterSpot: api.createSpot,
    modifierSpot: api.updateSpot,
    supprimerSpot: api.deleteSpot,
  };

  return <SpotsContext.Provider value={valeur}>{children}</SpotsContext.Provider>;
}

export function useSpots() {
  return useContext(SpotsContext);
}
