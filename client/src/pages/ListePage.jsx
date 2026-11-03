import { useState } from "react";
import { Link } from "react-router-dom";
import { useSpots } from "../context/SpotsContext";
import { CATEGORIES, ETATS, DANGERS, formaterDate, formaterGPS } from "../constantes";

export default function ListePage() {
  const { spots, chargement, favoris, basculerFavori } = useSpots();
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [etat, setEtat] = useState("");
  const [favorisSeuls, setFavorisSeuls] = useState(false);
  const [tri, setTri] = useState("recent");

  // On calcule la liste affichée à partir des filtres (pas besoin d'un autre state)
  const liste = spots
    .filter((s) => s.nom.toLowerCase().includes(recherche.toLowerCase()))
    .filter((s) => !categorie || s.categorie === categorie)
    .filter((s) => !etat || s.etat === etat)
    .filter((s) => !favorisSeuls || favoris.includes(s.id))
    .sort((a, b) => {
      if (tri === "nom") return a.nom.localeCompare(b.nom);
      if (tri === "messages") return b.nbMessages - a.nbMessages;
      return b.createdAt.localeCompare(a.createdAt); // plus récents d'abord
    });

  return (
    <div className="page">
      <h1>Les spots</h1>

      <div className="filtres">
        <input placeholder="Rechercher un nom…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={etat} onChange={(e) => setEtat(e.target.value)}>
          <option value="">Tous états</option>
          {ETATS.map((e) => <option key={e}>{e}</option>)}
        </select>
        <select value={tri} onChange={(e) => setTri(e.target.value)}>
          <option value="recent">Plus récents</option>
          <option value="nom">Nom (A → Z)</option>
          <option value="messages">Plus discutés</option>
        </select>
        <label className="case">
          <input type="checkbox" checked={favorisSeuls} onChange={(e) => setFavorisSeuls(e.target.checked)} />
          Favoris ({favoris.length})
        </label>
      </div>

      {chargement && <p>Chargement…</p>}
      {!chargement && liste.length === 0 && <p className="vide">Aucun spot ne correspond.</p>}

      <div className="grille">
        {liste.map((s) => (
          <article key={s.id} className="carte-spot">
            <button
              className={`etoile ${favoris.includes(s.id) ? "active" : ""}`}
              onClick={() => basculerFavori(s.id)}
              title="Favori"
            >
              {favoris.includes(s.id) ? "FAVORI" : "+ FAV"}
            </button>
            <h2><Link to={`/spots/${s.id}`}>{s.nom}</Link></h2>
            <p className="badges">
              <span className={`badge etat-${s.etat}`}>{s.etat}</span>
              <span className="badge">{s.categorie}</span>
              <span className="badge">Danger : {DANGERS[s.danger]}</span>
            </p>
            <p className="gps">{formaterGPS(s.lat, s.lng)}</p>
            <p className="description">{s.description || "Pas de description."}</p>
            <p className="petit">
              {s.nbMessages} msg · ajouté par {s.auteur} le {formaterDate(s.createdAt)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
