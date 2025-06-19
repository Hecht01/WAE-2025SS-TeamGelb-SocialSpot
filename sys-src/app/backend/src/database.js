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

export async function getEvents(userId, fetchAll) {
    const query = `
        SELECT  e.event_id,
                e.title,
                e.description,
                e.event_date,
                e.event_time,
                e.latitude,
                e.longitude,
                e.image_url,
                e.address,
                c.name AS city_name,
                c.district,
                u.user_uri,
                u.username,
                u.email,
                u.profile_picture_url,
                COUNT(DISTINCT ea.user_id) AS attendee_count,
                COUNT(DISTINCT el.user_id) AS like_count,
                COUNT(DISTINCT ec.comment_id) AS comment_count,
                CASE WHEN ea_me.user_id IS NOT NULL THEN true ELSE false END AS attended_by_me,
                CASE WHEN el_me.user_id IS NOT NULL THEN true ELSE false END AS liked_by_me
        FROM event e
                INNER JOIN app_user u ON e.creator_id = u.user_id
                LEFT JOIN city c ON e.city_id = c.city_id
                LEFT JOIN event_attendee ea ON e.event_id = ea.event_id
                LEFT JOIN event_like el ON e.event_id = el.event_id
                LEFT JOIN event_comment ec ON e.event_id = ec.event_id
                LEFT JOIN event_attendee ea_me ON e.event_id = ea_me.event_id AND ea_me.user_id = $1
                LEFT JOIN event_like el_me ON e.event_id = el_me.event_id AND el_me.user_id = $1
        WHERE $2 = True or e.creator_id = $1
        GROUP BY e.event_id,
                e.title,
                e.description,
                e.event_date,
                e.event_time,
                e.latitude,
                e.longitude,
                e.image_url,
                e.address,
                c.name,
                c.district,
                u.user_uri,
                u.username,
                u.email,
                u.profile_picture_url,
                ea_me.user_id,
                el_me.user_id;
    `;

    const res = await pool.query(query, [userId, fetchAll]);

    const formatDate = (date) => {
        return date.toLocaleDateString('sv-SE'); //for filter in map
    };

    return res.rows.map(row => ({
        id: row.event_id,
        title: row.title,
        description: row.description,
        date: formatDate(row.event_date),
        time: row.event_time,
        location: row.city_name,
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
        likeCount: row.like_count,
        likedByMe: row.liked_by_me,
        attendCount: row.attendee_count,
        attendedByMe: row.attended_by_me,
        commentCount: row.comment_count,
        attendees: [] // Can be extended later
    }));
}

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