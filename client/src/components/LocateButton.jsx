import { useState } from "react";

// Bouton de géolocalisation (navigator.geolocation, l'API native du navigateur)
export default function LocateButton({ onLocate }) {
  const [enCours, setEnCours] = useState(false);

  function localiser() {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas disponible sur ce navigateur");
      return;
    }
    setEnCours(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEnCours(false);
        onLocate({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 14 });
      },
      (err) => {
        setEnCours(false);
        alert("Position introuvable : " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <button className="btn-localiser" onClick={localiser} disabled={enCours}>
      {enCours ? "Localisation…" : "📍 Me localiser"}
    </button>
  );
}
