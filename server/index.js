// Serveur de l'Urbex Atlas
// - Comptes utilisateurs : inscription / connexion, mot de passe haché (bcrypt), jeton JWT
// - API REST pour le CRUD des spots et des favoris, stockés dans une base SQLite (db.js)
// - Socket.io pour le temps réel : mise à jour des spots chez tout le monde
//   + un salon de discussion par spot
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

// En ligne (Render), c'est l'hébergeur qui impose le port ; en local on reste sur 3001
// (une variable PORT locale pourrait sinon entrer en conflit avec le client Vite).
const PORT = process.env.RENDER ? process.env.PORT : 3001;
// Clé qui signe les jetons. En ligne, la définir dans les variables d'environnement de Render.
const SECRET = process.env.JWT_SECRET || "cle-de-dev-a-changer";
const dossier = path.dirname(fileURLToPath(import.meta.url));

// ---------- Lecture des spots ----------
// Un spot envoyé au client = le spot + son nombre de messages (calculé par SQL)
const SQL_SPOTS = `
  SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.spotId = s.id) AS nbMessages
  FROM spots s`;

function tousLesSpots() {
  return db.prepare(SQL_SPOTS + " ORDER BY s.createdAt").all();
}

function unSpot(id) {
  return db.prepare(SQL_SPOTS + " WHERE s.id = ?").get(id);
}

// Vérifie les champs envoyés par le formulaire
const CATEGORIES = ["Usine", "Hôpital", "Château", "Église", "Maison", "Militaire", "Autre"];
const ETATS = ["Accessible", "Difficile", "Muré", "Démoli"];

function valider(body) {
  const { nom, lat, lng, categorie, etat, danger } = body;
  if (!nom || !nom.trim()) return "Le nom est obligatoire";
  if (typeof lat !== "number" || typeof lng !== "number") return "Position invalide";
  if (!CATEGORIES.includes(categorie)) return "Catégorie invalide";
  if (!ETATS.includes(etat)) return "État invalide";
  if (![1, 2, 3].includes(danger)) return "Danger invalide (1 à 3)";
  return null;
}

// ---------- Express + Socket.io ----------
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Après chaque modification, on prévient tous les clients
function diffuserSpots() {
  io.emit("spots:update", tousLesSpots());
}

// ---------- Comptes ----------
// Le jeton contient l'id et le pseudo ; il est signé, donc impossible à modifier sans la clé
function creerJeton(user) {
  return jwt.sign({ id: user.id, pseudo: user.pseudo }, SECRET, { expiresIn: "7d" });
}

// Renvoie l'utilisateur du jeton, ou null si le jeton est faux, expiré, ou si le compte n'existe plus
function lireJeton(jeton) {
  try {
    const { id } = jwt.verify(jeton, SECRET);
    return db.prepare("SELECT id, pseudo FROM users WHERE id = ?").get(id) || null;
  } catch {
    return null;
  }
}

// Middleware : bloque la route si la requête n'a pas un jeton valide
// (en-tête "Authorization: Bearer <jeton>"), sinon met l'utilisateur dans req.user
function connecte(req, res, next) {
  const jeton = (req.headers.authorization || "").replace("Bearer ", "");
  req.user = lireJeton(jeton);
  if (!req.user) return res.status(401).json({ erreur: "Connecte-toi d'abord" });
  next();
}

app.post("/api/auth/inscription", (req, res) => {
  const pseudo = (req.body.pseudo || "").trim();
  const motDePasse = req.body.motDePasse || "";
  if (!/^[\w-]{3,20}$/.test(pseudo)) return res.status(400).json({ erreur: "Pseudo : 3 à 20 lettres, chiffres, - ou _" });
  if (motDePasse.length < 6) return res.status(400).json({ erreur: "Mot de passe : 6 caractères minimum" });
  if (db.prepare("SELECT id FROM users WHERE pseudo = ?").get(pseudo)) {
    return res.status(409).json({ erreur: "Ce pseudo est déjà pris" });
  }

  const hash = bcrypt.hashSync(motDePasse, 10);
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (pseudo, hash, createdAt) VALUES (?, ?, ?)")
    .run(pseudo, hash, new Date().toISOString());
  const user = { id: Number(lastInsertRowid), pseudo };
  res.status(201).json({ jeton: creerJeton(user), user });
});

app.post("/api/auth/connexion", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE pseudo = ?").get((req.body.pseudo || "").trim());
  // Même message dans les deux cas : on ne dit pas si c'est le pseudo ou le mot de passe qui est faux
  if (!user || !bcrypt.compareSync(req.body.motDePasse || "", user.hash)) {
    return res.status(401).json({ erreur: "Pseudo ou mot de passe incorrect" });
  }
  res.json({ jeton: creerJeton(user), user: { id: user.id, pseudo: user.pseudo } });
});

// Au rechargement de la page, le client vérifie que son jeton est encore valide
app.get("/api/auth/moi", connecte, (req, res) => {
  res.json({ id: req.user.id, pseudo: req.user.pseudo });
});

// ---------- Spots ----------
// READ : public
app.get("/api/spots", (req, res) => {
  res.json(tousLesSpots());
});

app.get("/api/spots/:id", (req, res) => {
  const spot = unSpot(req.params.id);
  if (!spot) return res.status(404).json({ erreur: "Spot introuvable" });
  res.json(spot);
});

// CREATE : il faut être connecté, l'auteur est celui du jeton
app.post("/api/spots", connecte, (req, res) => {
  const erreur = valider(req.body);
  if (erreur) return res.status(400).json({ erreur });

  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO spots (id, nom, description, categorie, etat, danger, lat, lng, auteur, auteurId, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    req.body.nom.trim(),
    (req.body.description || "").trim(),
    req.body.categorie,
    req.body.etat,
    req.body.danger,
    req.body.lat,
    req.body.lng,
    req.user.pseudo,
    req.user.id,
    new Date().toISOString()
  );
  diffuserSpots();
  res.status(201).json(unSpot(id));
});

// Seul l'auteur d'un spot peut le modifier ou le supprimer
function spotDuProprietaire(req, res) {
  const spot = unSpot(req.params.id);
  if (!spot) {
    res.status(404).json({ erreur: "Spot introuvable" });
    return null;
  }
  if (spot.auteurId !== req.user.id) {
    res.status(403).json({ erreur: "Seul l'auteur du spot peut le modifier" });
    return null;
  }
  return spot;
}

// UPDATE
app.put("/api/spots/:id", connecte, (req, res) => {
  const spot = spotDuProprietaire(req, res);
  if (!spot) return;

  const nouveau = { ...spot, ...req.body };
  const erreur = valider(nouveau);
  if (erreur) return res.status(400).json({ erreur });

  db.prepare(`UPDATE spots SET nom = ?, description = ?, categorie = ?, etat = ?, danger = ?, lat = ?, lng = ?, updatedAt = ?
              WHERE id = ?`).run(
    nouveau.nom.trim(),
    (nouveau.description || "").trim(),
    nouveau.categorie,
    nouveau.etat,
    nouveau.danger,
    nouveau.lat,
    nouveau.lng,
    new Date().toISOString(),
    spot.id
  );
  diffuserSpots();
  res.json(unSpot(spot.id));
});

// DELETE : les messages et les favoris du spot partent avec (ON DELETE CASCADE)
app.delete("/api/spots/:id", connecte, (req, res) => {
  const spot = spotDuProprietaire(req, res);
  if (!spot) return;

  db.prepare("DELETE FROM spots WHERE id = ?").run(spot.id);
  diffuserSpots();
  res.status(204).end();
});

// ---------- Favoris (propres à chaque compte) ----------
app.get("/api/favoris", connecte, (req, res) => {
  const lignes = db.prepare("SELECT spotId FROM favoris WHERE userId = ?").all(req.user.id);
  res.json(lignes.map((l) => l.spotId));
});

app.post("/api/favoris/:spotId", connecte, (req, res) => {
  if (!unSpot(req.params.spotId)) return res.status(404).json({ erreur: "Spot introuvable" });
  db.prepare("INSERT OR IGNORE INTO favoris (userId, spotId) VALUES (?, ?)").run(req.user.id, req.params.spotId);
  res.status(204).end();
});

app.delete("/api/favoris/:spotId", connecte, (req, res) => {
  db.prepare("DELETE FROM favoris WHERE userId = ? AND spotId = ?").run(req.user.id, req.params.spotId);
  res.status(204).end();
});

// ---------- Site React compilé (en ligne : un seul serveur pour l'API et le site) ----------
const DIST = path.join(dossier, "..", "client", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  // Toute autre URL (/spots/123, /stats…) renvoie index.html : React Router s'occupe du reste
  app.get("*", (req, res) => res.sendFile(path.join(DIST, "index.html")));
}

// ---------- Chat en temps réel : un salon (room) par spot ----------
// Le client envoie son jeton à la connexion ; sans jeton valide, il peut lire mais pas écrire
io.use((socket, next) => {
  socket.data.user = lireJeton(socket.handshake.auth?.jeton);
  next();
});

io.on("connection", (socket) => {
  // Le client ouvre la page d'un spot : il rejoint le salon et reçoit l'historique
  socket.on("chat:join", (spotId) => {
    socket.join(spotId);
    const historique = db.prepare("SELECT * FROM messages WHERE spotId = ? ORDER BY date").all(spotId);
    socket.emit("chat:history", historique);
  });

  socket.on("chat:leave", (spotId) => {
    socket.leave(spotId);
  });

  socket.on("chat:send", ({ spotId, texte }) => {
    const user = socket.data.user;
    if (!user || !texte || !texte.trim()) return;
    if (!unSpot(spotId)) return;

    const message = {
      id: crypto.randomUUID(),
      spotId,
      auteur: user.pseudo,
      auteurId: user.id,
      texte: texte.trim().slice(0, 500),
      date: new Date().toISOString(),
    };
    db.prepare("INSERT INTO messages (id, spotId, auteur, auteurId, texte, date) VALUES (?, ?, ?, ?, ?, ?)").run(
      message.id, message.spotId, message.auteur, message.auteurId, message.texte, message.date
    );

    io.to(spotId).emit("chat:message", message); // à tous ceux du salon
    diffuserSpots(); // le compteur de messages change
  });
});

httpServer.listen(PORT, () => {
  console.log(`Serveur Urbex Atlas sur http://localhost:${PORT}`);
});
