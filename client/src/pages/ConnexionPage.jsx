import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Une seule page pour la connexion et l'inscription : on bascule entre les deux modes
export default function ConnexionPage() {
  const { user, seConnecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nouveauCompte, setNouveauCompte] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Après connexion, on revient sur la page d'où l'on venait
  const retour = location.state?.depuis || "/";
  if (user) return <Navigate to={retour} replace />;

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await seConnecter(pseudo, motDePasse, nouveauCompte);
      navigate(retour, { replace: true });
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  }

  return (
    <div className="page connexion">
      <form className="connexion-carte" onSubmit={envoyer}>
        <p className="petit">// ACCÈS RESTREINT</p>
        <h1>{nouveauCompte ? "Créer un compte" : "Connexion"}</h1>
        <input
          placeholder="Pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          autoComplete="username"
          maxLength={20}
          autoFocus
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          autoComplete={nouveauCompte ? "new-password" : "current-password"}
        />
        {erreur && <p className="erreur" key={erreur}>{erreur}</p>}
        <button type="submit" disabled={envoi}>{nouveauCompte ? "S'inscrire" : "Entrer"}</button>
        <button
          type="button"
          className="lien"
          onClick={() => { setNouveauCompte(!nouveauCompte); setErreur(""); }}
        >
          {nouveauCompte ? "J'ai déjà un compte" : "Pas encore de compte ? S'inscrire"}
        </button>
      </form>
    </div>
  );
}
