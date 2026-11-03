import { useEffect, useRef, useState } from "react";
import { socket } from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formaterDate } from "../constantes";

// Chat en temps réel propre à un spot (un "salon" Socket.io par spot)
export default function Chat({ spotId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const finRef = useRef(null);

  useEffect(() => {
    function recevoirHistorique(liste) {
      setMessages(liste);
    }
    function recevoirMessage(message) {
      if (message.spotId === spotId) setMessages((m) => [...m, message]);
    }

    // Après une reconnexion (connexion au compte, coupure réseau…), le serveur a oublié
    // nos salons : on rejoint donc le salon à chaque "connect", pas seulement au montage.
    function rejoindre() {
      socket.emit("chat:join", spotId);
    }

    socket.on("chat:history", recevoirHistorique);
    socket.on("chat:message", recevoirMessage);
    socket.on("connect", rejoindre);
    rejoindre();

    // Nettoyage quand on quitte la page (ou qu'on change de spot)
    return () => {
      socket.emit("chat:leave", spotId);
      socket.off("connect", rejoindre);
      socket.off("chat:history", recevoirHistorique);
      socket.off("chat:message", recevoirMessage);
    };
  }, [spotId]);

  // Défile automatiquement vers le dernier message
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  function envoyer(e) {
    e.preventDefault();
    if (!texte.trim()) return;
    // pas besoin d'envoyer l'auteur : le serveur le connaît grâce au jeton
    socket.emit("chat:send", { spotId, texte });
    setTexte("");
  }

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.length === 0 && <p className="vide">Aucun message. Lance la discussion !</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-message ${user && m.auteurId === user.id ? "moi" : ""}`}>
            <span className="chat-auteur">{m.auteur}</span>
            <span className="chat-date">{formaterDate(m.date)}</span>
            <p>{m.texte}</p>
          </div>
        ))}
        <div ref={finRef} />
      </div>
      {user ? (
        <form className="chat-form" onSubmit={envoyer}>
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={`Message en tant que ${user.pseudo}…`}
            maxLength={500}
          />
          <button type="submit">Envoyer</button>
        </form>
      ) : (
        <p className="avertissement">
          // <Link to="/connexion" state={{ depuis: `/spots/${spotId}` }}>Connecte-toi</Link> pour écrire dans le chat.
        </p>
      )}
    </div>
  );
}
