import axios from 'axios';
import {AuthenticationError} from "apollo-server-express";
import session from "express-session";
const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Geocoding helper function
const geocodeAddress = async (address, city, state, country) => {
    try {
        // Build query string with optional parameters
        let query = address || '';
        if (city) query += query ? `, ${city}` : city;
        if (state) query += `, ${state}`;
        if (country) query += `, ${country}`;

        if (!query.trim()) {
            throw new Error('No address information provided for geocoding');
        }

        const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
        const response = await axios.get(nominatimUrl, {
            params: {
                q: query,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'SocialSpot/1.0'
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error(`Address not found: ${query}`);
        }

        const result = response.data[0];
        return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            display_name: result.display_name
        };
    } catch (error) {
        console.error('Geocoding error:', error.message);
        throw new Error(`Geocoding failed: ${error.message}`);
    }
};

export const resolvers = {
    Query: {
        userList: async (parent, args) => {
            const result = await pool.query('SELECT * FROM app_user');
            return result.rows;
        },

        eventList: async () => {
            const res = await pool.query(`
                SELECT e.*, u.username, u.email, u.profile_picture_url
                FROM event e
                         JOIN app_user u ON e.creator_id = u.user_id
            `);
            return res.rows.map(row => ({
                id: row.event_id,
                title: row.title,
                description: row.description,
                date: row.event_date,
                time: row.event_time,
                location: "TODO Ort",
                address: row.address,
                type: "Generic",
                latitude: row.latitude,
                longitude: row.longitude,
                thumbnail: row.image_url,
                author: {
                    user_uri: row.user_uri,
                    name: row.username,
                    email: row.email,
                    profilePicture: row.profile_picture_url,
                },
                attendees: []
            }));
        },

        myUser: async (_, args, context) => {


            if (!session || !session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = session.user;

            return {
                user_uri: user.user_uri,
                name: user.username,
                email: user.email,
                profilePicture: user.profile_picture_url
            };
        },

        getCreatedEvents: async (_, args) => {

            console.log("graphql " + session.id)
            console.log(session.user);

            if (!session || !session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = session.user;

            const query = `
                SELECT e.*, 
                       u.user_uri,
                       u.username, 
                       u.email, 
                       u.profile_picture_url
                  FROM event e
                  JOIN app_user u ON e.creator_id = u.user_id
                 WHERE e.creator_id = $1
            `;
            const values = [ user.user_id ];

            const result = await pool.query(query, values);

            return result.rows.map(row => ({
                id: row.event_id,
                title: row.title,
                description: row.description,
                date: row.event_date,
                time: row.event_time,
                location: "TODO Ort",
                address: row.address,
                type: "Generic", // You can join the category table for name
                latitude: row.latitude,
                longitude: row.longitude,
                thumbnail: row.image_url,
                author: {
                    user_uri: row.user_uri,
                    name: row.username,
                    email: row.email,
                    profilePicture: row.profile_picture_url,
                },
                attendees: [] // Can be extended later
            }));
        },

        getCities: async (_, args) => {
            const { nameLike } = args;
            const query = `
                SELECT min(city_id) as city_id,
                       name,
                       district,
                       state
                  FROM city 
                 WHERE lower(name) like lower($1) 
                 GROUP BY name, district, state
                 LIMIT 10
                 
            `;
            const values = [ (nameLike || '' ) + "%" ];
            const result = await pool.query(query, values);

            return result.rows.map(row => ({
                id: row.city_id,
                name: row.name,
                district: row.district,
                state: row.state
            }));
        }
    },

    Mutation: {
        createEvent: async (_, args) => {
            const {
                title, description, date, time,
                cityId, address, latitude, longitude,
                categoryId, imageUrl, city, state, country
            } = args;


            if (session || session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = session.user;

            if(imageUrl) {
                const checkQuery = `
                    SELECT true
                      FROM uploaded_images
                     WHERE image_url = $1
                       AND user_id = $2
                `;
                const checkResult = await pool.query(checkQuery, [imageUrl, user.user_id]);
                console.log(checkResult);
            }

            let finalLatitude = latitude;
            let finalLongitude = longitude;

            // If coordinates are not provided, try to geocode the address
            if (!latitude || !longitude) {
                try {
                    // First try to get city info from database if cityId is provided
                    let cityName = city;
                    let stateName = state;

                    if (!cityName && cityId) {
                        const cityQuery = `SELECT name, district, state FROM city WHERE city_id = $1`;
                        const cityResult = await pool.query(cityQuery, [cityId]);
                        if (cityResult.rows.length > 0) {
                            cityName = cityResult.rows[0].name;
                            stateName = cityResult.rows[0].state || cityResult.rows[0].district;
                        }
                    }

                    const geocodeResult = await geocodeAddress(address, cityName, stateName, country);
                    finalLatitude = geocodeResult.latitude;
                    finalLongitude = geocodeResult.longitude;

                    console.log(`Geocoded address: ${address}, ${cityName} -> ${finalLatitude}, ${finalLongitude}`);
                } catch (geocodeError) {
                    console.warn('Geocoding failed:', geocodeError.message);
                    // Continue without coordinates if geocoding fails
                    finalLatitude = null;
                    finalLongitude = null;
                }
            }

            const insertQuery = `
                INSERT INTO event (
                    title, description, event_date, event_time,
                    city_id, address, latitude, longitude,
                    creator_id, category_id, image_url
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    RETURNING *
            `;

            const values = [
                title, description, date, time,
                cityId, address, finalLatitude, finalLongitude,
                user.user_id, categoryId, imageUrl
            ];

            const result = await pool.query(insertQuery, values);
            const event = result.rows[0];

            return {
                id: event.event_id,
                title: event.title,
                description: event.description,
                date: event.event_date,
                time: event.event_time,
                location: event.city_id ? event.city_id.toString() : "Unknown",
                address: event.address,
                type: "Generic",
                latitude: event.latitude,
                longitude: event.longitude,
                thumbnail: event.image_url,
                author: {
                    user_uri: user.user_uri,
                    name: user.username,
                    email: user.email,
                    profilePicture: user.profile_picture_url
                },
                attendees: []
            };
        },

        deleteEvent : async (_, args) => {
            const { eventId } = args;

            if (session || session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }
            const user = session.user;

            const deleteQuery = `
                WITH deleted_rows AS (
                        DELETE FROM event
                    WHERE event_id = $1 AND creator_id = $2
                    RETURNING *
                )
                SELECT COUNT(*) FROM deleted_rows;
            `;
            const result = await pool.query(deleteQuery, [eventId, user.user_id]);

            const deletedCount = parseInt(result.rows[0].count);

            return deletedCount > 0;
        },

    }
};