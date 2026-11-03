import { Link } from "react-router-dom";
import { useSpots } from "../context/SpotsContext";
import { CATEGORIES, COULEUR_ETAT, ETATS, formaterDate } from "../constantes";

// Compte combien de spots ont chaque valeur (ex : combien par catégorie)
function compterPar(spots, champ, valeurs) {
  return valeurs.map((v) => ({ label: v, nombre: spots.filter((s) => s[champ] === v).length }));
}

// Petit graphique en barres horizontales, fait en CSS
function Barres({ donnees, couleur }) {
  const max = Math.max(1, ...donnees.map((d) => d.nombre));
  return (
    <div className="barres">
      {donnees.map((d) => (
        <div key={d.label} className="barre-ligne">
          <span className="barre-label">{d.label}</span>
          <div className="barre-fond">
            <div
              className="barre"
              style={{ width: `${(d.nombre / max) * 100}%`, background: couleur?.(d.label) }}
            />
          </div>
          <span className="barre-nombre">{d.nombre}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { spots, favoris } = useSpots();

  const total = spots.length;
  const accessibles = spots.filter((s) => s.etat === "Accessible").length;
  const pourcentage = total ? Math.round((accessibles / total) * 100) : 0;
  const nbMessages = spots.reduce((somme, s) => somme + s.nbMessages, 0);

  const derniers = [...spots].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const plusDiscutes = [...spots]
    .filter((s) => s.nbMessages > 0)
    .sort((a, b) => b.nbMessages - a.nbMessages)
    .slice(0, 3);

  return (
    <div className="page">
      <h1>Statistiques</h1>
      <p className="petit">Mises à jour en direct dès qu'un spot ou un message est ajouté.</p>

      <div className="tuiles">
        <div className="tuile"><strong>{total}</strong>spots</div>
        <div className="tuile"><strong>{pourcentage} %</strong>encore accessibles</div>
        <div className="tuile"><strong>{nbMessages}</strong>messages</div>
        <div className="tuile"><strong>{favoris.length}</strong>dans tes favoris</div>
      </div>

      <div className="stats-grille">
        <section className="bloc">
          <h2>Par catégorie</h2>
          <Barres donnees={compterPar(spots, "categorie", CATEGORIES)} />
        </section>
        <section className="bloc">
          <h2>Par état</h2>
          <Barres donnees={compterPar(spots, "etat", ETATS)} couleur={(etat) => COULEUR_ETAT[etat]} />
        </section>
        <section className="bloc">
          <h2>Derniers spots</h2>
          <ul className="liste-simple">
            {derniers.map((s) => (
              <li key={s.id}>
                <Link to={`/spots/${s.id}`}>{s.nom}</Link>
                <span className="petit">{formaterDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="bloc">
          <h2>Les plus discutés</h2>
          {plusDiscutes.length === 0 && <p className="vide">Pas encore de messages.</p>}
          <ul className="liste-simple">
            {plusDiscutes.map((s) => (
              <li key={s.id}>
                <Link to={`/spots/${s.id}`}>{s.nom}</Link>
                <span className="petit">💬 {s.nbMessages}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
