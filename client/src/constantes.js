// Valeurs partagées entre les composants (mêmes listes que dans le serveur)
export const CATEGORIES = ["Usine", "Hôpital", "Château", "Église", "Maison", "Militaire", "Autre"];

export const ETATS = ["Accessible", "Difficile", "Muré", "Démoli"];

// Couleur du marqueur selon l'état du spot
export const COULEUR_ETAT = {
  Accessible: "#A3B899", // vert-de-gris
  Difficile: "#E5A93C", // jaune signalétique
  Muré: "#D84A38", // rouge balise
  Démoli: "#8A8D91", // gris béton
};

// Coordonnées façon relevé GPS : 48.91020°N 2.42310°E
export function formaterGPS(lat, lng) {
  const ns = lat >= 0 ? "N" : "S";
  const eo = lng >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(5)}°${ns} ${Math.abs(lng).toFixed(5)}°${eo}`;
}

export const DANGERS = { 1: "Faible", 2: "Moyen", 3: "Élevé" };

export function formaterDate(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
