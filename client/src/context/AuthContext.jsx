// Utilisateur connecté, accessible partout avec le hook useAuth()
import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [verification, setVerification] = useState(true);

  // Au chargement : si un jeton est gardé, on demande au serveur s'il est encore valide
  useEffect(() => {
    if (!localStorage.getItem("jeton")) {
      setVerification(false);
      return;
    }
    api
      .moi()
      .then(setUser)
      .catch(() => api.setJeton(null)) // jeton expiré ou faux
      .finally(() => setVerification(false));
  }, []);

  async function seConnecter(pseudo, motDePasse, nouveauCompte) {
    const { jeton, user } = nouveauCompte
      ? await api.inscription(pseudo, motDePasse)
      : await api.connexion(pseudo, motDePasse);
    api.setJeton(jeton);
    setUser(user);
  }

  function seDeconnecter() {
    api.setJeton(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, verification, seConnecter, seDeconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
