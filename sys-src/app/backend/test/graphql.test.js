require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('../src/schema');
const { resolvers } = require('../src/index');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

let server;

const CREATE_EVENT = `
mutation CreateEvent(
  $title: String!
  $description: String!
  $date: String!
  $time: String!
  $cityId: Int!
  $address: String
  $latitude: Float
  $longitude: Float
  $creatorId: Int!
  $categoryId: Int
  $imageUrl: String
) {
  createEvent(
    title: $title
    description: $description
    date: $date
    time: $time
    cityId: $cityId
    address: $address
    latitude: $latitude
    longitude: $longitude
    creatorId: $creatorId
    categoryId: $categoryId
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
    // Seed required data
    await pool.query(`INSERT INTO app_user (username, email, password_hash) VALUES ('TestUser', 'test@example.com', 'hashed') RETURNING user_id`);
    await pool.query(`INSERT INTO city (country, postal_code, name, latitude, longitude) VALUES ('DE', 10115, 'Berlin', 52.5200, 13.4050) RETURNING city_id`);
    await pool.query(`INSERT INTO category (name, description) VALUES ('Tech', 'Technology events') RETURNING category_id`);

    // Start Apollo Server in-memory
    server = new ApolloServer({
        typeDefs,
        resolvers
    });

    await server.start();
});

afterAll(async () => {
    // Cleanup
    await pool.query(`DELETE FROM event`);
    await pool.query(`DELETE FROM app_user`);
    await pool.query(`DELETE FROM city`);
    await pool.query(`DELETE FROM category`);
    await pool.end();
    await server.stop();
});

describe('GraphQL API (Apollo Server v4+)', () => {

    it('creates an event', async () => {
        const variables = {
            title: "Test Event",
            description: "This is a test event",
            date: "2025-07-01",
            time: "18:00",
            cityId: 1,
            address: "Test St 123",
            latitude: 52.52,
            longitude: 13.40,
            creatorId: 1,
            categoryId: 1,
            imageUrl: "https://example.com/image.jpg"
        };

        const res = await server.executeOperation({
            query: CREATE_EVENT,
            variables,
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.createEvent.title).toBe("Test Event");
        expect(res.data.createEvent.author.name).toBe("TestUser");
    });

    it('fetches events', async () => {
        const res = await server.executeOperation({
            query: GET_EVENTS,
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.eventList.length).toBeGreaterThan(0);
    });

    it('fetches users', async () => {
        const res = await server.executeOperation({
            query: GET_USERS,
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.userList[0].name).toBe("TestUser");
    });

});
