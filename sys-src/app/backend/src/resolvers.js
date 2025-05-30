const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});


const resolvers = {
    Query: {
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
                location: row.city_id.toString(),
                address: row.address,
                type: "Generic", // You can join the category table for name
                latitude: row.latitude,
                longitude: row.longitude,
                thumbnail: row.image_url,
                author: {
                    id: row.creator_id,
                    name: row.username,
                    email: row.email,
                    profilePicture: row.profile_picture_url
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
        }
    },

    Mutation: {
        createEvent: async (_, args) => {
            const {
                title, description, date, time,
                cityId, address, latitude, longitude,
                creatorId, categoryId, imageUrl
            } = args;

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
                creatorId, categoryId, imageUrl
            ];

            const result = await pool.query(insertQuery, values);
            const event = result.rows[0];

            const userRes = await pool.query(`SELECT * FROM app_user WHERE user_id = $1`, [creatorId]);
            const user = userRes.rows[0];

            return {
                id: event.event_id,
                title: event.title,
                description: event.description,
                date: event.event_date,
                time: event.event_time,
                location: event.city_id.toString(),
                address: event.address,
                type: "Generic",
                latitude: event.latitude,
                longitude: event.longitude,
                thumbnail: event.image_url,
                author: {
                    id: user.user_id,
                    name: user.username,
                    email: user.email,
                    profilePicture: user.profile_picture_url
                },
                attendees: []
            };
        }
    }
};

module.exports = resolvers;