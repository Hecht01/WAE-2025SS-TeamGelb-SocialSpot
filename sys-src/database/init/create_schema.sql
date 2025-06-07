CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_user (
    user_id SERIAL PRIMARY KEY,
    google_auth_id VARCHAR(255) UNIQUE NOT NULL,
    user_uri uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    profile_picture_url VARCHAR(255),
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS city (
    city_id SERIAL PRIMARY KEY,
    country VARCHAR(3) NOT NULL,
    postal_code INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    geo GEOGRAPHY(POINT, 4326)
);

CREATE TABLE IF NOT EXISTS event (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    city_id INTEGER REFERENCES city (city_id),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geo GEOGRAPHY(POINT, 4326),
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255),
    creator_id INTEGER NOT NULL REFERENCES app_user (user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES category(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS event_attendee (
    event_id INTEGER REFERENCES event(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_user (user_id) ON DELETE CASCADE,
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_category (
    event_id INTEGER REFERENCES event(event_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES category (category_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, category_id)
);

CREATE TABLE IF NOT EXISTS event_like (
    event_id INTEGER REFERENCES event(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_user (user_id) ON DELETE CASCADE,
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_comment (
    comment_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES event(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES app_user (user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friendship (
    user_id INTEGER REFERENCES app_user (user_id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES app_user (user_id) ON DELETE CASCADE,
    gen_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Trigger to automatically populate geo from latitude & longitude
CREATE OR REPLACE FUNCTION update_geo()
RETURNS TRIGGER AS
$$
BEGIN
    NEW.geo = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_geo
BEFORE INSERT OR UPDATE ON city
FOR EACH ROW
WHEN (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL)
EXECUTE FUNCTION update_geo();

CREATE TRIGGER update_location_geo
BEFORE INSERT OR UPDATE ON event
FOR EACH ROW
WHEN (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL)
EXECUTE FUNCTION update_geo();

CREATE INDEX idx_events_creator ON event(creator_id);
CREATE INDEX idx_events_category ON event(category_id);
CREATE INDEX idx_events_date ON event(event_date);
CREATE INDEX idx_events_location ON event(city_id);
CREATE INDEX idx_attendees_event ON event_attendee (event_id);
CREATE INDEX idx_attendees_user ON event_attendee (user_id);
CREATE INDEX idx_comments_event ON event_comment (event_id);
CREATE INDEX idx_likes_event ON event_like (event_id);
CREATE INDEX idx_friendships_user ON friendship (user_id);

-- pg_trgm for accelerating text search
CREATE INDEX idx_events_title_trgm ON event USING GIN (title gin_trgm_ops);
CREATE INDEX idx_events_description_trgm ON event USING GIN (description gin_trgm_ops);

/*
COPY city(country, postal_code, name, latitude, longitude)
FROM 'germany_gis.csv'
DELIMITER ','
CSV HEADER;
 */

CREATE OR REPLACE FUNCTION upsert_user(
    p_google_auth_id TEXT,
    p_username TEXT,
    p_email TEXT,
    p_profile_picture_url TEXT
) RETURNS TABLE(
    user_id BIGINT,
    user_uri TEXT,
    username TEXT,
    email TEXT,
    profile_picture_url TEXT,
    gen_date TIMESTAMP,
    last_login TIMESTAMP,
    is_new_user BOOLEAN
) AS $$
DECLARE
    existing_user_id BIGINT;
BEGIN
    -- Try to find existing user
    SELECT u.user_id INTO existing_user_id
    FROM app_user u
    WHERE u.google_auth_id = p_google_auth_id;

    IF existing_user_id IS NOT NULL THEN
        -- Update existing user
        RETURN QUERY
        UPDATE app_user SET
            last_login = CURRENT_TIMESTAMP,
            profile_picture_url = p_profile_picture_url
        WHERE app_user.user_id = existing_user_id
        RETURNING app_user.user_id, app_user.user_uri, app_user.username,
                  app_user.email, app_user.profile_picture_url, app_user.gen_date,
                  app_user.last_login, false;
    ELSE
        -- Insert new user
        RETURN QUERY
        INSERT INTO app_user (google_auth_id, username, email, profile_picture_url, last_login)
        VALUES (p_google_auth_id, p_username, p_email, p_profile_picture_url, CURRENT_TIMESTAMP)
        RETURNING app_user.user_id, app_user.user_uri, app_user.username,
                  app_user.email, app_user.profile_picture_url, app_user.gen_date,
                  app_user.last_login, true;
    END IF;
END;
$$ LANGUAGE plpgsql;