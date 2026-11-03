import { NavLink, Route, Routes } from "react-router-dom";
import { useSpots } from "./context/SpotsContext";
import CartePage from "./pages/CartePage";
import ListePage from "./pages/ListePage";
import DetailPage from "./pages/DetailPage";
import StatsPage from "./pages/StatsPage";

export default function App() {
  const { pseudo, setPseudo, erreur } = useSpots();

  return (
    <div className="app">
      <header className="navbar">
        <span className="logo">Urbex <span>Atlas</span></span>
        <nav>
          <NavLink to="/" end>Carte</NavLink>
          <NavLink to="/spots">Spots</NavLink>
          <NavLink to="/stats">Stats</NavLink>
        </nav>
        <input
          className="pseudo"
          placeholder="Ton pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          maxLength={20}
        />
      </header>

      {erreur && <p className="bandeau-erreur">{erreur} (lance le serveur avec npm run dev)</p>}

      <main>
        <Routes>
          <Route path="/" element={<CartePage />} />
          <Route path="/spots" element={<ListePage />} />
          <Route path="/spots/:id" element={<DetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<p className="page">Page introuvable.</p>} />
        </Routes>
      </main>
    </div>
  );
}
