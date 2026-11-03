// Vue 3D du spot avec Streets GL (rendu 3D des bâtiments d'OpenStreetMap).
// Streets GL n'est pas une bibliothèque React : on l'intègre dans une iframe,
// et la position de la caméra se règle dans l'URL : #lat,lng,inclinaison,rotation,distance
export default function Vue3D({ lat, lng }) {
  const url = `https://streets.gl/#${lat.toFixed(5)},${lng.toFixed(5)},45.00,0.00,600.00`;
  return (
    <div className="vue-3d">
      <div className="vue-3d-cadre">
        <iframe src={url} title="Vue 3D Streets GL" allow="fullscreen" />
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="petit">Ouvrir Streets GL en plein écran</a>
    </div>
  );
}
