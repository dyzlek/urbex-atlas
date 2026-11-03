import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Composant sans affichage : quand "cible" change, la carte s'y déplace.
// useMap() donne accès à l'objet carte de Leaflet.
export default function FlyTo({ cible }) {
  const map = useMap();

  useEffect(() => {
    if (cible) {
      map.flyTo([cible.lat, cible.lng], cible.zoom || 15, { duration: 1.2 });
    }
  }, [cible, map]);

  return null;
}
