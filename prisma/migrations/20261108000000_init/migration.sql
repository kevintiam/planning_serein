-- Schéma PostgreSQL / Neon. Les UUID sont générés côté Node.
CREATE TABLE teams (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  invite_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Un compte appartient à une équipe ; une inscription ne peut créer un admin.
CREATE TABLE users (
  id uuid PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('admin', 'participant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, team_id)
);
-- Seul le condensat d'un jeton de session aléatoire est conservé.
CREATE TABLE sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
-- Brouillon et déclaration validée sont distingués explicitement.
CREATE TABLE declarations (
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  month char(7) NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, month),
  FOREIGN KEY(user_id, team_id) REFERENCES users(id, team_id) ON DELETE CASCADE
);
CREATE TABLE absences (
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  day date NOT NULL,
  PRIMARY KEY(user_id, day),
  FOREIGN KEY(user_id, team_id) REFERENCES users(id, team_id) ON DELETE CASCADE
);
CREATE INDEX absences_team_day_idx ON absences(team_id, day);
CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL,
  day date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  FOREIGN KEY(participant_id, team_id) REFERENCES users(id, team_id)
);
CREATE INDEX tasks_team_day_idx ON tasks(team_id, day);
CREATE TABLE schedules (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  month char(7) NOT NULL,
  published_at timestamptz,
  PRIMARY KEY(team_id, month)
);
-- Compteurs partagés entre instances Node ; pas de limite uniquement en mémoire.
CREATE TABLE rate_limits (
  key char(64) PRIMARY KEY,
  attempts integer NOT NULL,
  reset_at timestamptz NOT NULL
);
