
DROP TABLE IF EXISTS Songs;

-- Create Songs table if it doesn't exist
CREATE TABLE IF NOT EXISTS Songs (
    id TEXT PRIMARY KEY not null,
    name TEXT not null,
    favorite BOOLEAN DEFAULT 0 not null,
    instrument TEXT not null,
    createdAt TEXT DEFAULT (datetime('now')) not null
);

DROP TABLE IF EXISTS Bars;

-- Create Bars table if it doesn't exist
CREATE TABLE IF NOT EXISTS Bars (
    id INTEGER PRIMARY KEY,
    songId TEXT not null,
    name TEXT not null,
    bpm INTEGER not null,
    timeSignature INTEGER not null,
    subBeats INTEGER not null,
    delay INTEGER not null,
    numberOfBars INTEGER not null,
    FOREIGN KEY(songId) REFERENCES Songs(id) ON DELETE CASCADE
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_songId ON Bars(songId);

-- Insert or replace data into Songs table
INSERT OR REPLACE INTO Songs (id, name, favorite, instrument, createdAt) VALUES 
('1', 'Test Song', 0, 'Piano', datetime('now')),
('2', 'Morning Breeze', 1, 'Guitar', datetime('now')),
('3', 'Nightfall Symphony', 0, 'Violin', datetime('now')),
('4', 'Rhythmic Pulse', 1, 'Drums', datetime('now')),
('5', 'Soothing Waves', 0, 'Flute', datetime('now'));

-- Insert or replace data into Bars table
INSERT OR REPLACE INTO Bars (songId, name, bpm, timeSignature, subBeats, delay, numberOfBars) VALUES 
-- Bars for "Test Song"
('1', 'Allegro', 120, 4, 1, 0, 2),
('1', 'Larghetto', 60, 4, 4, 500, 2),
('1', 'Andantino', 80, 6, 3, 0, 2),

-- Bars for "Morning Breeze"
('2', 'Moderato', 100, 4, 2, 200, 4),
('2', 'Adagio', 70, 3, 3, 0, 3),
('2', 'Vivace', 140, 4, 1, 0, 2),

-- Bars for "Nightfall Symphony"
('3', 'Lento', 50, 6, 2, 300, 4),
('3', 'Presto', 160, 4, 1, 0, 3),
('3', 'Grave', 40, 3, 4, 600, 2),

-- Bars for "Rhythmic Pulse"
('4', 'Allegretto', 110, 7, 1, 100, 4),
('4', 'Poco a Poco', 90, 5, 3, 0, 3),
('4', 'Molto Allegro', 130, 4, 2, 0, 2),

-- Bars for "Soothing Waves"
('5', 'Andante', 75, 4, 2, 400, 4),
('5', 'Largo', 50, 3, 3, 200, 3),
('5', 'Moderato Cantabile', 95, 4, 1, 0, 2);


