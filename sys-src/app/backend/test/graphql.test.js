import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import {typeDefs} from '../src/schema.js';
import { resolvers } from '../src/resolvers.js';
import { Pool } from 'pg';


if (process.env.NODE_ENV !== 'production') {
    await import('dotenv').then(dotenv => {
        dotenv.config({path: '../../.env'});
    });
}

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.PG_PORT,
});

let server;
let creatorId, cityId, categoryId;

const CREATE_EVENT = `
mutation CreateEvent(
  $title: String!,
  $description: String!,
  $date: String!,
  $time: String!,
  $cityId: Int!,
  $address: String,
  $latitude: Float,
  $longitude: Float,
  $creatorId: Int!,
  $categoryId: Int,
  $imageUrl: String
) {
  createEvent(
    title: $title,
    description: $description,
    date: $date,
    time: $time,
    cityId: $cityId,
    address: $address,
    latitude: $latitude,
    longitude: $longitude,
    creatorId: $creatorId,
    categoryId: $categoryId,
    imageUrl: $imageUrl
  ) {
    id
    title
    author {
      id
      name
    }
  }
}
`;


const GET_EVENTS = `
query {
  eventList {
    id
    title
    author {
      name
    }
  }
}
`;

const GET_USERS = `
query {
  userList {
    id
    name
    email
  }
}
`;

beforeAll(async () => {
    // Clean up any leftover data
    await pool.query(`TRUNCATE event, app_user, city, category RESTART IDENTITY CASCADE`);

    const userRes = await pool.query(
        `INSERT INTO app_user (username, email, password_hash)
     VALUES ('TestUser', 'test@example.com', 'hashed')
     RETURNING user_id`
    );
    creatorId = userRes.rows[0].user_id;

    const cityRes = await pool.query(
        `INSERT INTO city (country, postal_code, name, latitude, longitude)
     VALUES ('DE', 10115, 'Berlin', 52.5200, 13.4050)
     RETURNING city_id`
    );
    cityId = cityRes.rows[0].city_id;

    const catRes = await pool.query(
        `INSERT INTO category (name, description)
     VALUES ('Tech', 'Technology events')
     RETURNING category_id`
    );
    categoryId = catRes.rows[0].category_id;

    server = new ApolloServer({ typeDefs, resolvers, context: async () => ({ pool }) });
    await server.start();
});


afterAll(async () => {
    try {
        await server?.stop(); // Gracefully stop Apollo Server
        await pool?.end();    // Close PostgreSQL pool
    } catch (err) {
        console.error('Error during teardown:', err);
    }
});


describe('GraphQL API (Apollo Server v4+)', () => {

    it('creates an event', async () => {
        const variables = {
            title: "Test Event",
            description: "This is a test event",
            date: "2025-07-01",
            time: "18:00",
            cityId,
            address: "Test St 123",
            latitude: 52.52,
            longitude: 13.40,
            creatorId,
            categoryId,
            imageUrl: "https://example.com/image.jpg"
        };

        const res = await server.executeOperation(
            {query: CREATE_EVENT,
             variables ,
            contextValue: { pool } },
        );

        console.log(JSON.stringify(res, null, 2));

        //expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event");
        expect(res.body.singleResult.data.createEvent.author.name).toBe("TestUser");
    });

    it('fetches events', async () => {
        const res = await server.executeOperation(
            { query: GET_EVENTS ,
            contextValue: { pool } }
        );

        console.log(JSON.stringify(res, null, 2));

       // expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.eventList.length).toBeGreaterThan(0);
    });

    it('fetches users', async () => {
        const res = await server.executeOperation(
            { query: GET_USERS ,
            contextValue: { pool } }
        );

        console.log('userList response:', JSON.stringify(res, null, 2));
        console.log('errors:', res?.body?.singleResult?.errors);

        //expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.userList[0].name).toBe("TestUser");
    });

});
