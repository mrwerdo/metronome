DROP TABLE IF EXISTS Songs;
DROP TABLE IF EXISTS Bars;

-- Create Songs table with a JSON document field and generated columns
CREATE TABLE IF NOT EXISTS Songs (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
    document JSON NOT NULL,
    name TEXT GENERATED ALWAYS AS (json_extract(document, '$.name')) STORED,
    favorite BOOLEAN GENERATED ALWAYS AS (json_extract(document, '$.favorite')) VIRTUAL,
    instrument TEXT GENERATED ALWAYS AS (json_extract(document, '$.instrument')) VIRTUAL,
    createdAt TEXT GENERATED ALWAYS AS (json_extract(document, '$.createdAt')) VIRTUAL,
    CHECK (
        json_valid(document) AND
        json_extract(document, '$.name') IS NOT NULL AND
        json_extract(document, '$.favorite') IS NOT NULL AND
        json_extract(document, '$.instrument') IS NOT NULL AND
        json_extract(document, '$.createdAt') IS NOT NULL AND
        json_type(json_extract(document, '$.bars')) = 'array'
    )
);

DROP TRIGGER IF EXISTS set_document_id;

CREATE TRIGGER set_document_id_after_update
AFTER UPDATE ON Songs
FOR EACH ROW
BEGIN
    UPDATE Songs SET document = json_set(NEW.document, '$.id', NEW.id) WHERE id = NEW.id;
END;

CREATE TRIGGER set_document_id_after_insert
AFTER INSERT ON Songs
FOR EACH ROW
BEGIN
    UPDATE Songs SET document = json_set(NEW.document, '$.id', NEW.id) WHERE id = NEW.id;
END;

-- -- Insert sample data into Songs table
INSERT OR REPLACE INTO Songs (id, document) VALUES 
('1', '{"id": "1", "name": "Test Song", "favorite": false, "instrument": "Piano", "createdAt": "2024-08-20T16:06:00", "sections": [{"id": 0, "name": "Allegro", "bpm": 120, "timeSignature": 4, "subBeats": 1, "delay": 0, "numberOfBars": 2}, {"id": 1, "name": "Larghetto", "bpm": 60, "timeSignature": 4, "subBeats": 4, "delay": 500, "numberOfBars": 2}, {"id": 2, "name": "Andantino", "bpm": 80, "timeSignature": 6, "subBeats": 3, "delay": 0, "numberOfBars": 2}]}'),
('2', '{"id": "2", "name": "Morning Breeze", "favorite": true, "instrument": "Guitar", "createdAt": "2024-08-20T16:06:00", "sections": [{"id": 0, "name": "Moderato", "bpm": 100, "timeSignature": 4, "subBeats": 2, "delay": 200, "numberOfBars": 4}, {"id": 1, "name": "Adagio", "bpm": 70, "timeSignature": 3, "subBeats": 3, "delay": 0, "numberOfBars": 3}, {"id": 2, "name": "Vivace", "bpm": 140, "timeSignature": 4, "subBeats": 1, "delay": 0, "numberOfBars": 2}]}'),
('3', '{"id": "3", "name": "Nightfall Symphony", "favorite": false, "instrument": "Violin", "createdAt": "2024-08-20T16:06:00", "sections": [{"id": 0, "name": "Lento", "bpm": 50, "timeSignature": 6, "subBeats": 2, "delay": 300, "numberOfBars": 4}, {"id": 1, "name": "Presto", "bpm": 160, "timeSignature": 4, "subBeats": 1, "delay": 0, "numberOfBars": 3}, {"id": 2, "name": "Grave", "bpm": 40, "timeSignature": 3, "subBeats": 4, "delay": 600, "numberOfBars": 2}]}'),
('4', '{"id": "4", "name": "Rhythmic Pulse", "favorite": true, "instrument": "Drums", "createdAt": "2024-08-20T16:06:00", "sections": [{"id": 0, "name": "Allegretto", "bpm": 110, "timeSignature": 7, "subBeats": 1, "delay": 100, "numberOfBars": 4}, {"id": 1, "name": "Poco a Poco", "bpm": 90, "timeSignature": 5, "subBeats": 3, "delay": 0, "numberOfBars": 3}, {"id": 2, "name": "Molto Allegro", "bpm": 130, "timeSignature": 4, "subBeats": 2, "delay": 0, "numberOfBars": 2}]}'),
('5', '{"id": "5", "name": "Soothing Waves", "favorite": false, "instrument": "Flute", "createdAt": "2024-08-20T16:06:00", "sections": [{"id": 0, "name": "Andante", "bpm": 75, "timeSignature": 4, "subBeats": 2, "delay": 400, "numberOfBars": 4}, {"id": 1, "name": "Largo", "bpm": 50, "timeSignature": 3, "subBeats": 3, "delay": 200, "numberOfBars": 3}, {"id": 2, "name": "Moderato Cantabile", "bpm": 95, "timeSignature": 4, "subBeats": 1, "delay": 0, "numberOfBars": 2}]}');
