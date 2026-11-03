import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSpots } from "./context/SpotsContext";
import { useAuth } from "./context/AuthContext";
import CartePage from "./pages/CartePage";
import ListePage from "./pages/ListePage";
import DetailPage from "./pages/DetailPage";
import StatsPage from "./pages/StatsPage";
import ConnexionPage from "./pages/ConnexionPage";

export default function App() {
  const { erreur } = useSpots();
  const { user, seDeconnecter } = useAuth();
  const location = useLocation();

  return (
    <div className="app">
      <header className="navbar">
        <span className="logo">Urbex <span>Atlas</span></span>
        <nav>
          <NavLink to="/" end>Carte</NavLink>
          <NavLink to="/spots">Spots</NavLink>
          <NavLink to="/stats">Stats</NavLink>
        </nav>
        <div className="compte">
          {user ? (
            <>
              <span className="compte-pseudo">{user.pseudo}</span>
              <button className="secondaire" onClick={seDeconnecter}>Déconnexion</button>
            </>
          ) : (
            <Link to="/connexion" state={{ depuis: location.pathname }} className="bouton">Connexion</Link>
          )}
        </div>
      </header>

      {erreur && <p className="bandeau-erreur">{erreur} (lance le serveur avec npm run dev)</p>}

      {/* key = l'URL : à chaque changement de page le bloc est recréé, ce qui rejoue l'animation d'entrée */}
      <main key={location.pathname} className="entree-page">
        <Routes location={location}>
          <Route path="/" element={<CartePage />} />
          <Route path="/spots" element={<ListePage />} />
          <Route path="/spots/:id" element={<DetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/connexion" element={<ConnexionPage />} />
          <Route path="*" element={<p className="page">Page introuvable.</p>} />
        </Routes>
      </main>
    </div>
  );
}
