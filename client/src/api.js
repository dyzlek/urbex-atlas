// Tous les échanges avec le serveur passent par ce fichier
import { io } from "socket.io-client";

// Le jeton de connexion (JWT) est gardé dans le localStorage pour rester connecté
let jeton = localStorage.getItem("jeton");

// Une seule connexion Socket.io pour toute l'appli (le proxy Vite la redirige vers le port 3001).
// Le jeton est envoyé à la connexion : c'est lui qui donne le droit d'écrire dans le chat.
export const socket = io({ auth: (cb) => cb({ jeton }) });

export function setJeton(nouveau) {
  jeton = nouveau;
  if (nouveau) localStorage.setItem("jeton", nouveau);
  else localStorage.removeItem("jeton");
  // On se reconnecte pour que le serveur connaisse le nouvel utilisateur
  socket.disconnect().connect();
}

async function requete(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(jeton && { Authorization: `Bearer ${jeton}` }),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.erreur || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// Comptes
export const inscription = (pseudo, motDePasse) =>
  requete("/api/auth/inscription", { method: "POST", body: JSON.stringify({ pseudo, motDePasse }) });

export const connexion = (pseudo, motDePasse) =>
  requete("/api/auth/connexion", { method: "POST", body: JSON.stringify({ pseudo, motDePasse }) });

export const moi = () => requete("/api/auth/moi");

// Spots
export const getSpots = () => requete("/api/spots");

export const createSpot = (spot) =>
  requete("/api/spots", { method: "POST", body: JSON.stringify(spot) });

export const updateSpot = (id, champs) =>
  requete(`/api/spots/${id}`, { method: "PUT", body: JSON.stringify(champs) });

export const deleteSpot = (id) => requete(`/api/spots/${id}`, { method: "DELETE" });

// Favoris
export const getFavoris = () => requete("/api/favoris");
export const ajouterFavori = (id) => requete(`/api/favoris/${id}`, { method: "POST" });
export const retirerFavori = (id) => requete(`/api/favoris/${id}`, { method: "DELETE" });

// Recherche d'adresse avec l'API Nominatim d'OpenStreetMap
export async function rechercherAdresse(texte) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" +
    encodeURIComponent(texte);
  const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
  if (!res.ok) throw new Error("Recherche impossible");
  return res.json(); // [{ display_name, lat, lon }, ...]
}
