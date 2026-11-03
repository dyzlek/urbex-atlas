import { useMapEvents } from "react-leaflet";

// Composant sans affichage : il écoute les clics sur la carte
// et renvoie la position cliquée au parent.
export default function MapClick({ onClick }) {
  const map = useMapEvents({
    click(e) {
      // Un clic sur un bouton de popup (Annuler, Ajouter…) remonte aussi jusqu'à la carte.
      // On ne garde que les clics faits sur la carte elle-même : pas dans une popup, et pas sur
      // un élément que React vient d'enlever de la page (le formulaire fermé par Annuler).
      const cible = e.originalEvent.target;
      if (!map.getContainer().contains(cible) || cible.closest(".leaflet-popup")) return;
      onClick(e.latlng);
    },
  });
  return null;
}
