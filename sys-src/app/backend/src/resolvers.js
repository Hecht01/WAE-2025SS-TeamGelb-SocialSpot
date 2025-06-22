import axios from 'axios';
import {pool, getEvents} from './database.js';
import {AuthenticationError, UserInputError} from "apollo-server-express";

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
        eventList: async (_, args, context) => {
            const { req } = context;

            let userId = -1; // Default to -1 for unauthenticated users
            if (req.session && req.session.user) {
                userId = req.session.user.user_id;
            }

            return getEvents(userId, true);
        },

        userList: async () => {
            const res = await pool.query(`SELECT * FROM app_user`);
            return res.rows.map(user => ({
                id: user.user_id,
                name: user.username,
                email: user.email,
                profilePicture: user.profile_picture_url
            }));
        },

        myUser: async (_, args, context) => {
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            return {
                user_uri: user.user_uri,
                name: user.username,
                email: user.email,
                profilePicture: user.profile_picture_url
            };
        },

        getCreatedEvents: async (_, args, context) => {
            const { req } = context;
            let userId = -1; // Default to -1 for unauthenticated users
            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }
            userId = req.session.user.user_id;

            return getEvents(userId, false);
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
        },
        user: async (_, args) => {
            const query = `SELECT * FROM app_user WHERE user_uri = $1`;
            const result = await pool.query(query, [args.user_uri]);

            if (result.rows.length === 0) {
                return null;
            }

            const user = result.rows[0];
            return {
                user_uri: user.user_uri,
                name: user.username,
                email: user.email,
                profilePicture: user.profile_picture_url
            };
        },
        event: async (_, args) => {
            const { title } = args;
            const query = `
                SELECT e.event_id as id,
                       e.title,
                       e.address,
                       e.description,
                       e.event_date,
                       u.username as author,
                       c.name as city_name
                FROM event e
                         INNER JOIN app_user u ON e.creator_id = u.user_id
                         LEFT JOIN city c ON e.city_id = c.city_id
                WHERE lower(e.title) LIKE lower($1)
            `;

            const result = await pool.query(query, [`%${title}%`]);
            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                address: row.address,
                date: row.event_date.toLocaleDateString('sv-SE'),
                author: row.author,
                description: row.description,
                city: row.city_name,
            }));
        },
    },

    Mutation: {
        createEvent: async (_, args, context) => {
            const {
                title, description, date, time,
                cityId, address, imageUrl
            } = args;

            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

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

            let latitude = null;
            let longitude = null;

            try {
                // First try to get city info from database if cityId is provided
                let cityName;
                let stateName;
                let country = 'DE';

                if (!cityName && cityId) {
                    const cityQuery = `SELECT name, district, state FROM city WHERE city_id = $1`;
                    const cityResult = await pool.query(cityQuery, [cityId]);
                    if (cityResult.rows.length > 0) {
                        cityName = cityResult.rows[0].name;
                        stateName = cityResult.rows[0].state || cityResult.rows[0].district;
                    }
                }

                const geocodeResult = await geocodeAddress(address, cityName, stateName, country);
                latitude = geocodeResult.latitude;
                longitude = geocodeResult.longitude;

                console.log(`Geocoded address: ${address}, ${cityName} -> ${latitude}, ${longitude}`);
            } catch (geocodeError) {
                console.warn('Geocoding failed:', geocodeError.message);
                throw new UserInputError('Invalid Address provided');
            }

            const insertQuery = `
                INSERT INTO event (
                    title, description, event_date, event_time,
                    city_id, address, latitude, longitude,
                    creator_id, image_url
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                RETURNING *
            `;


            const values = [
                title, description, date, time,
                cityId, address, latitude, longitude,
                user.user_id, imageUrl
            ];

            const result = await pool.query(insertQuery, values);
            const event = result.rows[0];

            return event.event_id;
        },

        deleteEvent : async (_, args, context) => {
            const { eventId } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }
            const user = req.session.user;

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

        attendEvent: async (_, args, context) => {
            const { id: eventId } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const insertQuery = `
                INSERT INTO event_attendee (event_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (event_id, user_id) DO NOTHING
            `;

            await pool.query(insertQuery, [eventId, user.user_id]);

            return true;
        },

        leaveEvent: async (_, args, context) => {
            const { id: eventId } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const deleteQuery = `
                DELETE FROM event_attendee
                WHERE event_id = $1 AND user_id = $2
            `;
            const result = await pool.query(deleteQuery, [eventId, user.user_id]);
            const deletedCount = result.rowCount;
            return deletedCount > 0;
        },

        likeEvent: async (_, args, context) => {
            const { id: eventId } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const insertQuery = `
                INSERT INTO event_like (event_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (event_id, user_id) DO NOTHING
            `;

            await pool.query(insertQuery, [eventId, user.user_id]);

            return true;
        },

        removeLikeEvent: async (_, args, context) => {
            const { id: eventId } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const deleteQuery = `
                DELETE FROM event_like
                WHERE event_id = $1 AND user_id = $2
            `;
            const result = await pool.query(deleteQuery, [eventId, user.user_id]);
            const deletedCount = result.rowCount;
            return deletedCount > 0;
        },

        commentEvent: async (_, args, context) => {
            const { eventId, comment } = args;
            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const insertQuery = `
                INSERT INTO event_comment (event_id, user_id, content)
                VALUES ($1, $2, $3)
            `;
            const result = await pool.query(insertQuery, [eventId, user.user_id, comment]);
            return true;
        }
    }
};