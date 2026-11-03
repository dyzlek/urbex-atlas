// Valeurs partagées entre les composants (mêmes listes que dans le serveur)
export const CATEGORIES = ["Usine", "Hôpital", "Château", "Église", "Maison", "Militaire", "Autre"];

export const ETATS = ["Accessible", "Difficile", "Muré", "Démoli"];

// Couleur du marqueur selon l'état du spot
export const COULEUR_ETAT = {
  Accessible: "#3fb950",
  Difficile: "#d29922",
  Muré: "#f85149",
  Démoli: "#6e7681",
};

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
