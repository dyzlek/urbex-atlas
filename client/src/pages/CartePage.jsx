import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useSpots } from "../context/SpotsContext";
import { COULEUR_ETAT, DANGERS, ETATS, formaterDate, formaterGPS } from "../constantes";
import { iconeNouveau, iconeSpot } from "../components/icones";
import MapClick from "../components/MapClick";
import FlyTo from "../components/FlyTo";
import SearchBar from "../components/SearchBar";
import LocateButton from "../components/LocateButton";
import SpotForm from "../components/SpotForm";

const CENTRE_PAR_DEFAUT = [43.3442, 3.2158]; // Béziers

export default function CartePage() {
  const { spots, favoris, ajouterSpot, modifierSpot, supprimerSpot } = useSpots();
  const location = useLocation();

  // Si on arrive depuis "Voir sur la carte", on centre sur ce spot
  const [cible, setCible] = useState(location.state?.cible || null);
  const [nouveauPoint, setNouveauPoint] = useState(null); // position cliquée
  const [enEdition, setEnEdition] = useState(null); // id du spot modifié
  const [maPosition, setMaPosition] = useState(null);

  function localiser(position) {
    setMaPosition(position);
    setCible(position);
  }

  async function creer(valeurs) {
    await ajouterSpot({ ...valeurs, lat: nouveauPoint.lat, lng: nouveauPoint.lng });
    setNouveauPoint(null);
  }

  async function enregistrer(id, valeurs) {
    await modifierSpot(id, valeurs);
    setEnEdition(null);
  }

  function supprimer(spot) {
    if (window.confirm(`Supprimer « ${spot.nom} » et sa discussion ?`)) {
      supprimerSpot(spot.id);
    }
  }

  return (
    <div className="carte-page">
      <div className="carte-outils">
        <SearchBar onSelect={setCible} />
        <LocateButton onLocate={localiser} />
      </div>
      <p className="astuce petit">// Clique sur la carte pour ajouter un spot.</p>

      <div className="carte-cadre">
      {/* Incrustation façon caméra de surveillance */}
      <div className="rec">
        <b>REC</b> CAM-01<br />
        {formaterDate(new Date().toISOString())}<br />
        {spots.length} SPOTS RELEVÉS
      </div>
      <MapContainer center={CENTRE_PAR_DEFAUT} zoom={10} className="carte">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClick onClick={(latlng) => { setNouveauPoint(latlng); setEnEdition(null); }} />
        <FlyTo cible={cible} />

        {maPosition && (
          <CircleMarker center={maPosition} radius={9} pathOptions={{ color: "#58a6ff" }}>
            <Popup>Vous êtes ici</Popup>
          </CircleMarker>
        )}

        {/* Les spots existants */}
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={iconeSpot(spot.etat, favoris.includes(spot.id))}
            eventHandlers={{ popupclose: () => setEnEdition(null) }}
          >
            <Popup minWidth={240}>
              {enEdition === spot.id ? (
                <SpotForm
                  initial={spot}
                  texteBouton="Enregistrer"
                  onSubmit={(valeurs) => enregistrer(spot.id, valeurs)}
                  onCancel={() => setEnEdition(null)}
                />
              ) : (
                <div className="popup-spot">
                  <h3>{spot.nom}</h3>
                  <p className="badges">
                    <span className={`badge etat-${spot.etat}`}>{spot.etat}</span>
                    <span className="badge">{spot.categorie}</span>
                    <span className="badge">Danger : {DANGERS[spot.danger]}</span>
                  </p>
                  <p className="gps">{formaterGPS(spot.lat, spot.lng)}</p>
                  {spot.description && <p>{spot.description}</p>}
                  <p className="petit">{spot.nbMessages} message(s) · par {spot.auteur}</p>
                  <div className="ligne">
                    <Link to={`/spots/${spot.id}`} className="bouton">Détails & chat</Link>
                    <button className="secondaire" onClick={() => setEnEdition(spot.id)}>Modifier</button>
                    <button className="danger" onClick={() => supprimer(spot)}>Supprimer</button>
                  </div>
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {/* Le point qu'on est en train d'ajouter : sa popup s'ouvre toute seule.
            (Pas de "popupclose" ici : en mode dev, StrictMode ferme la popup une fois au montage,
            ce qui supprimerait le point aussitôt.) */}
        {nouveauPoint && (
          <Marker
            position={nouveauPoint}
            icon={iconeNouveau}
            eventHandlers={{ add: (e) => e.target.openPopup() }}
          >
            <Popup minWidth={240}>
              <h3>Nouveau spot</h3>
              <p className="gps">{formaterGPS(nouveauPoint.lat, nouveauPoint.lng)}</p>
              <SpotForm onSubmit={creer} onCancel={() => setNouveauPoint(null)} />
            </Popup>
          </Marker>
        )}
      </MapContainer>
      </div>

      <div className="legende">
        {ETATS.map((etat) => (
          <span key={etat}><i style={{ background: COULEUR_ETAT[etat] }} /> {etat}</span>
        ))}
        <span><i className="legende-favori" /> Favori</span>
      </div>
    </div>
  );
}
