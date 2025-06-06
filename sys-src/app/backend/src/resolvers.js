import {pool} from './database.js';
import {AuthenticationError} from "apollo-server-express";

export const resolvers = {
    Query: {
        eventList: async () => {
            const res = await pool.query(`
                SELECT e.*, u.user_uri, u.username, u.email, u.profile_picture_url
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

            console.log("graphql " + req.session.id)
            console.log(req.session.user);

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
            console.log(values);

            const result = await pool.query(query, values);
            console.log(result);

            return result.rows.map(row => ({
                id: row.city_id,
                name: row.name,
                district: row.district,
                state: row.state
            }));
        }
    },

    Mutation: {
        createEvent: async (_, args, context) => {
            const {
                title, description, date, time,
                cityId, address, latitude, longitude,
                categoryId, imageUrl
            } = args;

            const { req } = context;

            if (!req.session || !req.session.user) {
                throw new AuthenticationError('Authentication required. Please log in.');
            }

            const user = req.session.user;

            const insertQuery = `
                INSERT INTO event (
                    title, description, event_date, event_time,
                    city_id, address, latitude, longitude,
                    creator_id, category_id, image_url
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                RETURNING *
            `;


            const values = [
                title, description, date, time,
                cityId, address, latitude, longitude,
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
                location: 4207, //event.city_id.toString(),
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
        }
    }
};