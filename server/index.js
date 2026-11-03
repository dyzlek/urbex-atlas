// Serveur de l'Urbex Atlas
// - API REST pour le CRUD des spots (GET / POST / PUT / DELETE)
// - Socket.io pour le temps réel : mise à jour des spots chez tout le monde
//   + un salon de discussion par spot
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 3001;
const dossier = path.dirname(fileURLToPath(import.meta.url));
const FICHIER = path.join(dossier, "data.json");

// ---------- Stockage dans un fichier JSON ----------
function lireDonnees() {
  if (!fs.existsSync(FICHIER)) {
    fs.copyFileSync(path.join(dossier, "data.seed.json"), FICHIER);
  }
  return JSON.parse(fs.readFileSync(FICHIER, "utf-8"));
}

function sauver() {
  fs.writeFileSync(FICHIER, JSON.stringify(db, null, 2));
}

const db = lireDonnees(); // { spots: [], messages: [] }

// Un spot envoyé au client = le spot + son nombre de messages
function avecCompteur(spot) {
  const nbMessages = db.messages.filter((m) => m.spotId === spot.id).length;
  return { ...spot, nbMessages };
}

function tousLesSpots() {
  return db.spots.map(avecCompteur);
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

// Après chaque modification : on sauvegarde et on prévient tous les clients
function diffuserSpots() {
  sauver();
  io.emit("spots:update", tousLesSpots());
}

// READ
app.get("/api/spots", (req, res) => {
  res.json(tousLesSpots());
});

app.get("/api/spots/:id", (req, res) => {
  const spot = db.spots.find((s) => s.id === req.params.id);
  if (!spot) return res.status(404).json({ erreur: "Spot introuvable" });
  res.json(avecCompteur(spot));
});

// CREATE
app.post("/api/spots", (req, res) => {
  const erreur = valider(req.body);
  if (erreur) return res.status(400).json({ erreur });

  const spot = {
    id: crypto.randomUUID(),
    nom: req.body.nom.trim(),
    description: (req.body.description || "").trim(),
    categorie: req.body.categorie,
    etat: req.body.etat,
    danger: req.body.danger,
    lat: req.body.lat,
    lng: req.body.lng,
    auteur: req.body.auteur || "Anonyme",
    createdAt: new Date().toISOString(),
  };
  db.spots.push(spot);
  diffuserSpots();
  res.status(201).json(avecCompteur(spot));
});

// UPDATE
app.put("/api/spots/:id", (req, res) => {
  const spot = db.spots.find((s) => s.id === req.params.id);
  if (!spot) return res.status(404).json({ erreur: "Spot introuvable" });

  const nouveau = { ...spot, ...req.body, id: spot.id, createdAt: spot.createdAt };
  const erreur = valider(nouveau);
  if (erreur) return res.status(400).json({ erreur });

  Object.assign(spot, nouveau, { updatedAt: new Date().toISOString() });
  diffuserSpots();
  res.json(avecCompteur(spot));
});

// DELETE (on supprime aussi les messages du spot)
app.delete("/api/spots/:id", (req, res) => {
  const index = db.spots.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ erreur: "Spot introuvable" });

  db.spots.splice(index, 1);
  db.messages = db.messages.filter((m) => m.spotId !== req.params.id);
  diffuserSpots();
  res.status(204).end();
});

// ---------- Chat en temps réel : un salon (room) par spot ----------
io.on("connection", (socket) => {
  // Le client ouvre la page d'un spot : il rejoint le salon et reçoit l'historique
  socket.on("chat:join", (spotId) => {
    socket.join(spotId);
    const historique = db.messages.filter((m) => m.spotId === spotId);
    socket.emit("chat:history", historique);
  });

  socket.on("chat:leave", (spotId) => {
    socket.leave(spotId);
  });

  socket.on("chat:send", ({ spotId, auteur, texte }) => {
    if (!texte || !texte.trim()) return;
    if (!db.spots.some((s) => s.id === spotId)) return;

    const message = {
      id: crypto.randomUUID(),
      spotId,
      auteur: auteur || "Anonyme",
      texte: texte.trim().slice(0, 500),
      date: new Date().toISOString(),
    };
    db.messages.push(message);
    sauver();

    io.to(spotId).emit("chat:message", message); // à tous ceux du salon
    io.emit("spots:update", tousLesSpots()); // le compteur de messages change
  });
});

httpServer.listen(PORT, () => {
  console.log(`Serveur Urbex Atlas sur http://localhost:${PORT}`);
});
