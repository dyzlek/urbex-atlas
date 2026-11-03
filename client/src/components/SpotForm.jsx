import { useState } from "react";
import { CATEGORIES, ETATS, DANGERS } from "../constantes";

const VIDE = { nom: "", description: "", categorie: "Usine", etat: "Accessible", danger: 1 };

// Formulaire utilisé pour l'ajout ET la modification d'un spot.
// "initial" = les valeurs de départ (un spot existant, ou rien pour un nouveau).
export default function SpotForm({ initial = VIDE, onSubmit, onCancel, texteBouton = "Ajouter" }) {
  const [valeurs, setValeurs] = useState({
    nom: initial.nom,
    description: initial.description,
    categorie: initial.categorie,
    etat: initial.etat,
    danger: initial.danger,
  });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Un seul handler pour tous les champs, grâce à l'attribut "name"
  function changer(e) {
    const { name, value } = e.target;
    setValeurs((v) => ({ ...v, [name]: name === "danger" ? Number(value) : value }));
  }

  async function envoyer(e) {
    e.preventDefault();
    if (!valeurs.nom.trim()) {
      setErreur("Donne un nom au spot");
      return;
    }
    setEnvoi(true);
    try {
      await onSubmit(valeurs);
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  }

  return (
    <form className="spot-form" onSubmit={envoyer}>
      <input name="nom" placeholder="Nom du spot" value={valeurs.nom} onChange={changer} autoFocus />
      <textarea
        name="description"
        placeholder="Description, conseils…"
        rows={3}
        value={valeurs.description}
        onChange={changer}
      />
      <div className="ligne">
        <select name="categorie" value={valeurs.categorie} onChange={changer}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="etat" value={valeurs.etat} onChange={changer}>
          {ETATS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </div>
      <label>
        Danger :
        <select name="danger" value={valeurs.danger} onChange={changer}>
          {Object.entries(DANGERS).map(([n, label]) => (
            <option key={n} value={n}>{label}</option>
          ))}
        </select>
      </label>
      {erreur && <p className="erreur">{erreur}</p>}
      <div className="ligne">
        <button type="submit" disabled={envoi}>{texteBouton}</button>
        {onCancel && (
          <button type="button" className="secondaire" onClick={onCancel}>Annuler</button>
        )}
      </div>
    </form>
  );
}
