import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { useSpots } from "../context/SpotsContext";
import { DANGERS, formaterDate, formaterGPS } from "../constantes";
import { iconeSpot } from "../components/icones";
import SpotForm from "../components/SpotForm";
import Chat from "../components/Chat";

export default function DetailPage() {
  const { id } = useParams(); // l'id vient de l'URL /spots/:id
  const navigate = useNavigate();
  const { spots, chargement, favoris, basculerFavori, modifierSpot, supprimerSpot } = useSpots();
  const [edition, setEdition] = useState(false);

  const spot = spots.find((s) => s.id === id);

  if (chargement) return <p className="page">Chargement…</p>;
  if (!spot) {
    return (
      <div className="page">
        <p>Ce spot n'existe pas (ou vient d'être supprimé).</p>
        <Link to="/spots">← Retour à la liste</Link>
      </div>
    );
  }

  async function enregistrer(valeurs) {
    await modifierSpot(spot.id, valeurs);
    setEdition(false);
  }

  async function supprimer() {
    if (window.confirm(`Supprimer « ${spot.nom} » et sa discussion ?`)) {
      await supprimerSpot(spot.id);
      navigate("/spots");
    }
  }

  const favori = favoris.includes(spot.id);

  return (
    <div className="page detail">
      <Link to="/spots">← Tous les spots</Link>

      <div className="detail-grille">
        <section>
          {edition ? (
            <>
              <h1>Modifier le spot</h1>
              <SpotForm initial={spot} texteBouton="Enregistrer" onSubmit={enregistrer} onCancel={() => setEdition(false)} />
            </>
          ) : (
            <>
              <h1>{spot.nom}</h1>
              <p className="badges">
                <span className={`badge etat-${spot.etat}`}>{spot.etat}</span>
                <span className="badge">{spot.categorie}</span>
                <span className="badge">Danger : {DANGERS[spot.danger]}</span>
              </p>
              <p className="gps">{formaterGPS(spot.lat, spot.lng)}</p>
              <p>{spot.description || "Pas de description."}</p>
              <p className="petit">
                Ajouté par {spot.auteur} le {formaterDate(spot.createdAt)}
                {spot.updatedAt && ` · modifié le ${formaterDate(spot.updatedAt)}`}
              </p>
              <div className="ligne">
                <button onClick={() => basculerFavori(spot.id)}>{favori ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
                <button className="secondaire" onClick={() => setEdition(true)}>Modifier</button>
                <button className="danger" onClick={supprimer}>Supprimer</button>
              </div>
            </>
          )}

          <MapContainer
            key={spot.id}
            center={[spot.lat, spot.lng]}
            zoom={15}
            className="mini-carte"
            scrollWheelZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[spot.lat, spot.lng]} icon={iconeSpot(spot.etat, favori)} />
          </MapContainer>
          <button
            className="secondaire"
            onClick={() => navigate("/", { state: { cible: { lat: spot.lat, lng: spot.lng, zoom: 16 } } })}
          >
            Voir sur la grande carte
          </button>
        </section>

        <section>
          <h2>Discussion en direct</h2>
          <Chat spotId={spot.id} />
        </section>
      </div>
    </div>
  );
}
