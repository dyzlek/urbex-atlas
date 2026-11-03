import { useState } from "react";
import { rechercherAdresse } from "../api";

// Barre de recherche d'adresse (API Nominatim).
// Quand on choisit un résultat, on appelle onSelect({ lat, lng }).
export default function SearchBar({ onSelect }) {
  const [texte, setTexte] = useState("");
  const [resultats, setResultats] = useState([]);
  const [message, setMessage] = useState("");

  async function chercher(e) {
    e.preventDefault();
    if (!texte.trim()) return;
    setMessage("Recherche…");
    try {
      const data = await rechercherAdresse(texte);
      setResultats(data);
      setMessage(data.length === 0 ? "Aucun résultat" : "");
    } catch {
      setMessage("Erreur pendant la recherche");
    }
  }

  function choisir(r) {
    onSelect({ lat: Number(r.lat), lng: Number(r.lon), zoom: 15 });
    setResultats([]);
    setTexte(r.display_name);
  }

  return (
    <div className="recherche">
      <form onSubmit={chercher}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Chercher une adresse, une ville…"
        />
        <button type="submit">Chercher</button>
      </form>
      {message && <p className="recherche-message">{message}</p>}
      {resultats.length > 0 && (
        <ul className="recherche-resultats">
          {resultats.map((r) => (
            <li key={r.place_id} onClick={() => choisir(r)}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
