// Tous les échanges avec le serveur passent par ce fichier
import { io } from "socket.io-client";

// Une seule connexion Socket.io pour toute l'appli (le proxy Vite la redirige vers le port 3001)
export const socket = io();

async function requete(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.erreur || `Erreur ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getSpots = () => requete("/api/spots");

export const createSpot = (spot) =>
  requete("/api/spots", { method: "POST", body: JSON.stringify(spot) });

export const updateSpot = (id, champs) =>
  requete(`/api/spots/${id}`, { method: "PUT", body: JSON.stringify(champs) });

export const deleteSpot = (id) => requete(`/api/spots/${id}`, { method: "DELETE" });

// Recherche d'adresse avec l'API Nominatim d'OpenStreetMap
export async function rechercherAdresse(texte) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" +
    encodeURIComponent(texte);
  const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
  if (!res.ok) throw new Error("Recherche impossible");
  return res.json(); // [{ display_name, lat, lon }, ...]
}
