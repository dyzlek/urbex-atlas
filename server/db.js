// Base de données SQLite (module node:sqlite intégré à Node, rien à installer).
// Le fichier server/urbex.db est créé au premier lancement et rempli avec data.seed.json.
import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dossier = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(dossier, "urbex.db"));

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo    TEXT NOT NULL UNIQUE COLLATE NOCASE,
    hash      TEXT NOT NULL,            -- mot de passe haché avec bcrypt, jamais en clair
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spots (
    id          TEXT PRIMARY KEY,
    nom         TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    categorie   TEXT NOT NULL,
    etat        TEXT NOT NULL,
    danger      INTEGER NOT NULL,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    auteur      TEXT NOT NULL,           -- pseudo affiché
    auteurId    INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL pour les spots de départ
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id       TEXT PRIMARY KEY,
    spotId   TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    auteur   TEXT NOT NULL,
    auteurId INTEGER REFERENCES users(id) ON DELETE SET NULL,
    texte    TEXT NOT NULL,
    date     TEXT NOT NULL
  );

  -- Table de liaison : un utilisateur a plusieurs favoris, un spot est le favori de plusieurs utilisateurs
  CREATE TABLE IF NOT EXISTS favoris (
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spotId TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    PRIMARY KEY (userId, spotId)
  );
`);

// Base vide : on la remplit avec les données de départ
if (db.prepare("SELECT COUNT(*) AS n FROM spots").get().n === 0) {
  const seed = JSON.parse(fs.readFileSync(path.join(dossier, "data.seed.json"), "utf-8"));
  const ajoutSpot = db.prepare(`INSERT INTO spots (id, nom, description, categorie, etat, danger, lat, lng, auteur, createdAt)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const ajoutMessage = db.prepare("INSERT INTO messages (id, spotId, auteur, texte, date) VALUES (?, ?, ?, ?, ?)");
  for (const s of seed.spots) {
    ajoutSpot.run(s.id, s.nom, s.description, s.categorie, s.etat, s.danger, s.lat, s.lng, s.auteur, s.createdAt);
  }
  for (const m of seed.messages) ajoutMessage.run(m.id, m.spotId, m.auteur, m.texte, m.date);
}

export default db;
