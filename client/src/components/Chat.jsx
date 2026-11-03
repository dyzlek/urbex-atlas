import { useEffect, useRef, useState } from "react";
import { socket } from "../api";
import { useSpots } from "../context/SpotsContext";
import { formaterDate } from "../constantes";

// Chat en temps réel propre à un spot (un "salon" Socket.io par spot)
export default function Chat({ spotId }) {
  const { pseudo } = useSpots();
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

    socket.on("chat:history", recevoirHistorique);
    socket.on("chat:message", recevoirMessage);
    socket.emit("chat:join", spotId);

    // Nettoyage quand on quitte la page (ou qu'on change de spot)
    return () => {
      socket.emit("chat:leave", spotId);
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
    socket.emit("chat:send", { spotId, auteur: pseudo || "Anonyme", texte });
    setTexte("");
  }

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.length === 0 && <p className="vide">Aucun message. Lance la discussion !</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-message ${m.auteur === pseudo ? "moi" : ""}`}>
            <span className="chat-auteur">{m.auteur}</span>
            <span className="chat-date">{formaterDate(m.date)}</span>
            <p>{m.texte}</p>
          </div>
        ))}
        <div ref={finRef} />
      </div>
      <form className="chat-form" onSubmit={envoyer}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={`Message en tant que ${pseudo || "Anonyme"}…`}
          maxLength={500}
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}
