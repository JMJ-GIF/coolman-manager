-- Migration: Add match type fields (player_count, match_nature, team names, scoring_team, lineup_team)
-- Run this on an existing database to apply the new schema changes.
-- Execute for both coolman and demo databases.

\c coolman

ALTER TABLE matches ADD COLUMN IF NOT EXISTS player_count VARCHAR(10) DEFAULT '11v11' NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_nature VARCHAR(20) DEFAULT '경기' NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_name VARCHAR(255) NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_name VARCHAR(255) NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS include_in_records BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE quarters ADD COLUMN IF NOT EXISTS team_b_tactics VARCHAR(255) NULL;

ALTER TABLE goals ADD COLUMN IF NOT EXISTS scoring_team CHAR(1) NULL;

ALTER TABLE quarters_lineup ADD COLUMN IF NOT EXISTS lineup_team CHAR(1) NULL;

INSERT INTO positions (tactics, name, description, top_coordinate, left_coordinate)
SELECT * FROM (VALUES
  ('3-3-2', 'GK',  'Goalkeeper',              90, 50),
  ('3-3-2', 'LB',  'Left Back',               70, 20),
  ('3-3-2', 'CCB', 'Center Back',             70, 50),
  ('3-3-2', 'RB',  'Right Back',              70, 80),
  ('3-3-2', 'LM',  'Left Midfielder',         45, 20),
  ('3-3-2', 'CM',  'Central Midfielder',      45, 50),
  ('3-3-2', 'RM',  'Right Midfielder',        45, 80),
  ('3-3-2', 'LST', 'Left Striker',            15, 35),
  ('3-3-2', 'RST', 'Right Striker',           15, 65),
  ('3-2-3', 'GK',  'Goalkeeper',              90, 50),
  ('3-2-3', 'LB',  'Left Back',               70, 20),
  ('3-2-3', 'CCB', 'Center Back',             70, 50),
  ('3-2-3', 'RB',  'Right Back',              70, 80),
  ('3-2-3', 'LCM', 'Left Central Midfielder', 45, 35),
  ('3-2-3', 'RCM', 'Right Central Midfielder',45, 65),
  ('3-2-3', 'LW',  'Left Winger',             15, 20),
  ('3-2-3', 'CF',  'Center Forward',          15, 50),
  ('3-2-3', 'RW',  'Right Winger',            15, 80),
  ('2-3-3', 'GK',  'Goalkeeper',              90, 50),
  ('2-3-3', 'LCB', 'Left Center Back',        70, 33),
  ('2-3-3', 'RCB', 'Right Center Back',       70, 67),
  ('2-3-3', 'LM',  'Left Midfielder',         50, 20),
  ('2-3-3', 'CM',  'Central Midfielder',      50, 50),
  ('2-3-3', 'RM',  'Right Midfielder',        50, 80),
  ('2-3-3', 'LW',  'Left Winger',             15, 20),
  ('2-3-3', 'CF',  'Center Forward',          15, 50),
  ('2-3-3', 'RW',  'Right Winger',            15, 80),
  ('4-3-2', 'GK',  'Goalkeeper',              90, 50),
  ('4-3-2', 'LB',  'Left Back',               70, 15),
  ('4-3-2', 'LCB', 'Left Center Back',        70, 37),
  ('4-3-2', 'RCB', 'Right Center Back',       70, 63),
  ('4-3-2', 'RB',  'Right Back',              70, 85),
  ('4-3-2', 'LM',  'Left Midfielder',         45, 20),
  ('4-3-2', 'CM',  'Central Midfielder',      45, 50),
  ('4-3-2', 'RM',  'Right Midfielder',        45, 80),
  ('4-3-2', 'LST', 'Left Striker',            15, 35),
  ('4-3-2', 'RST', 'Right Striker',           15, 65),
  ('3-4-2', 'GK',  'Goalkeeper',              90, 50),
  ('3-4-2', 'LCB', 'Left Center Back',        70, 20),
  ('3-4-2', 'CCB', 'Center Back',             70, 50),
  ('3-4-2', 'RCB', 'Right Center Back',       70, 80),
  ('3-4-2', 'LM',  'Left Midfielder',         45, 15),
  ('3-4-2', 'LCM', 'Left Central Midfielder', 45, 38),
  ('3-4-2', 'RCM', 'Right Central Midfielder',45, 63),
  ('3-4-2', 'RM',  'Right Midfielder',        45, 85),
  ('3-4-2', 'LST', 'Left Striker',            15, 35),
  ('3-4-2', 'RST', 'Right Striker',           15, 65),
  ('3-3-3', 'GK',  'Goalkeeper',              90, 50),
  ('3-3-3', 'LCB', 'Left Center Back',        70, 20),
  ('3-3-3', 'CCB', 'Center Back',             70, 50),
  ('3-3-3', 'RCB', 'Right Center Back',       70, 80),
  ('3-3-3', 'LM',  'Left Midfielder',         45, 20),
  ('3-3-3', 'CM',  'Central Midfielder',      45, 50),
  ('3-3-3', 'RM',  'Right Midfielder',        45, 80),
  ('3-3-3', 'LW',  'Left Winger',             15, 20),
  ('3-3-3', 'CF',  'Center Forward',          15, 50),
  ('3-3-3', 'RW',  'Right Winger',            15, 80)
) AS new_data(tactics, name, description, top_coordinate, left_coordinate)
WHERE NOT EXISTS (
  SELECT 1 FROM positions p WHERE p.tactics = new_data.tactics
);

\c demo

ALTER TABLE matches ADD COLUMN IF NOT EXISTS player_count VARCHAR(10) DEFAULT '11v11' NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_nature VARCHAR(20) DEFAULT '경기' NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_name VARCHAR(255) NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_name VARCHAR(255) NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS include_in_records BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE quarters ADD COLUMN IF NOT EXISTS team_b_tactics VARCHAR(255) NULL;

ALTER TABLE goals ADD COLUMN IF NOT EXISTS scoring_team CHAR(1) NULL;

ALTER TABLE quarters_lineup ADD COLUMN IF NOT EXISTS lineup_team CHAR(1) NULL;

INSERT INTO positions (tactics, name, description, top_coordinate, left_coordinate)
SELECT * FROM (VALUES
  ('3-3-2', 'GK',  'Goalkeeper',              90, 50),
  ('3-3-2', 'LB',  'Left Back',               70, 20),
  ('3-3-2', 'CCB', 'Center Back',             70, 50),
  ('3-3-2', 'RB',  'Right Back',              70, 80),
  ('3-3-2', 'LM',  'Left Midfielder',         45, 20),
  ('3-3-2', 'CM',  'Central Midfielder',      45, 50),
  ('3-3-2', 'RM',  'Right Midfielder',        45, 80),
  ('3-3-2', 'LST', 'Left Striker',            15, 35),
  ('3-3-2', 'RST', 'Right Striker',           15, 65),
  ('3-2-3', 'GK',  'Goalkeeper',              90, 50),
  ('3-2-3', 'LB',  'Left Back',               70, 20),
  ('3-2-3', 'CCB', 'Center Back',             70, 50),
  ('3-2-3', 'RB',  'Right Back',              70, 80),
  ('3-2-3', 'LCM', 'Left Central Midfielder', 45, 35),
  ('3-2-3', 'RCM', 'Right Central Midfielder',45, 65),
  ('3-2-3', 'LW',  'Left Winger',             15, 20),
  ('3-2-3', 'CF',  'Center Forward',          15, 50),
  ('3-2-3', 'RW',  'Right Winger',            15, 80),
  ('2-3-3', 'GK',  'Goalkeeper',              90, 50),
  ('2-3-3', 'LCB', 'Left Center Back',        70, 33),
  ('2-3-3', 'RCB', 'Right Center Back',       70, 67),
  ('2-3-3', 'LM',  'Left Midfielder',         50, 20),
  ('2-3-3', 'CM',  'Central Midfielder',      50, 50),
  ('2-3-3', 'RM',  'Right Midfielder',        50, 80),
  ('2-3-3', 'LW',  'Left Winger',             15, 20),
  ('2-3-3', 'CF',  'Center Forward',          15, 50),
  ('2-3-3', 'RW',  'Right Winger',            15, 80),
  ('4-3-2', 'GK',  'Goalkeeper',              90, 50),
  ('4-3-2', 'LB',  'Left Back',               70, 15),
  ('4-3-2', 'LCB', 'Left Center Back',        70, 37),
  ('4-3-2', 'RCB', 'Right Center Back',       70, 63),
  ('4-3-2', 'RB',  'Right Back',              70, 85),
  ('4-3-2', 'LM',  'Left Midfielder',         45, 20),
  ('4-3-2', 'CM',  'Central Midfielder',      45, 50),
  ('4-3-2', 'RM',  'Right Midfielder',        45, 80),
  ('4-3-2', 'LST', 'Left Striker',            15, 35),
  ('4-3-2', 'RST', 'Right Striker',           15, 65),
  ('3-4-2', 'GK',  'Goalkeeper',              90, 50),
  ('3-4-2', 'LCB', 'Left Center Back',        70, 20),
  ('3-4-2', 'CCB', 'Center Back',             70, 50),
  ('3-4-2', 'RCB', 'Right Center Back',       70, 80),
  ('3-4-2', 'LM',  'Left Midfielder',         45, 15),
  ('3-4-2', 'LCM', 'Left Central Midfielder', 45, 38),
  ('3-4-2', 'RCM', 'Right Central Midfielder',45, 63),
  ('3-4-2', 'RM',  'Right Midfielder',        45, 85),
  ('3-4-2', 'LST', 'Left Striker',            15, 35),
  ('3-4-2', 'RST', 'Right Striker',           15, 65),
  ('3-3-3', 'GK',  'Goalkeeper',              90, 50),
  ('3-3-3', 'LCB', 'Left Center Back',        70, 20),
  ('3-3-3', 'CCB', 'Center Back',             70, 50),
  ('3-3-3', 'RCB', 'Right Center Back',       70, 80),
  ('3-3-3', 'LM',  'Left Midfielder',         45, 20),
  ('3-3-3', 'CM',  'Central Midfielder',      45, 50),
  ('3-3-3', 'RM',  'Right Midfielder',        45, 80),
  ('3-3-3', 'LW',  'Left Winger',             15, 20),
  ('3-3-3', 'CF',  'Center Forward',          15, 50),
  ('3-3-3', 'RW',  'Right Winger',            15, 80)
) AS new_data(tactics, name, description, top_coordinate, left_coordinate)
WHERE NOT EXISTS (
  SELECT 1 FROM positions p WHERE p.tactics = new_data.tactics
);
