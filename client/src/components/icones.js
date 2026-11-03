import L from "leaflet";
import { COULEUR_ETAT } from "../constantes";

// Marqueur rond coloré selon l'état du spot (L.divIcon = icône en HTML/CSS)
export function iconeSpot(etat, favori = false) {
  return L.divIcon({
    className: "",
    html: `<div class="marqueur ${favori ? "marqueur-favori" : ""}" style="background:${COULEUR_ETAT[etat]}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export const iconeNouveau = L.divIcon({
  className: "",
  html: '<div class="marqueur marqueur-nouveau">+</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});
