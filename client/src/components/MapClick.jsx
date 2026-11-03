import { useMapEvents } from "react-leaflet";

// Composant sans affichage : il écoute les clics sur la carte
// et renvoie la position cliquée au parent.
export default function MapClick({ onClick }) {
  useMapEvents({
    click(e) {
      // Un clic dans une popup (bouton Annuler, Ajouter…) remonte jusqu'à la carte : on l'ignore
      if (e.originalEvent.target.closest(".leaflet-popup")) return;
      onClick(e.latlng);
    },
  });
  return null;
}
