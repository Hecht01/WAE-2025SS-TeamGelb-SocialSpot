import {Pool} from "pg";

if (process.env.NODE_ENV !== 'production') {
    await import('dotenv').then(dotenv => {
        dotenv.config({path: '../../.env'});
    });
}

export const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.PG_PORT,
});

export async function upsertUserGoogle(userData) {
    const google_auth_id = userData.id;
    const email = userData.email;
    const username = userData.given_name;
    const profile_picture_url = userData.picture;

    try {
        const upsertQuery = `
            INSERT INTO app_user (google_auth_id, username, email, profile_picture_url, last_login)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (google_auth_id) 
            DO UPDATE SET 
                last_login = CURRENT_TIMESTAMP,
                profile_picture_url = EXCLUDED.profile_picture_url
            RETURNING user_id, user_uri, username, email, profile_picture_url, gen_date, last_login,
                     (xmax = 0) AS is_new_user
        `;

        const result = await pool.query(upsertQuery, [
            google_auth_id,
            username,
            email,
            profile_picture_url
        ]);

        return {
            success: true,
            isNewUser: result.rows[0].is_new_user,
            user: {
                user_id: result.rows[0].user_id,
                user_uri: result.rows[0].user_uri,
                username: result.rows[0].username,
                email: result.rows[0].email,
                profile_picture_url: result.rows[0].profile_picture_url,
                gen_date: result.rows[0].gen_date,
                last_login: result.rows[0].last_login
            }
        };

    } catch (error) {
        console.error('Error in upsertUserWithUpsert:', error);

        if (error.code === '23505') {
            return {
                success: false,
                error: 'Duplicate user info',
                code: 'DUPLICATE_USER'
            };
        }

        return {
            success: false,
            error: 'Database error occurred',
            details: error.message
        };
    }
}