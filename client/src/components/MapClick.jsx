import { useMapEvents } from "react-leaflet";

// Composant sans affichage : il écoute les clics sur la carte
// et renvoie la position cliquée au parent.
export default function MapClick({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}
