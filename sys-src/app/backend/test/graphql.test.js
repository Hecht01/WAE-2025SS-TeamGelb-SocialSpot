import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../src/schema.js';
import resolvers from '../src/resolvers.js';
import { Pool } from 'pg';
import axios from 'axios';

// Mock axios for geocoding tests
vi.mock('axios');
const mockedAxios = axios;

if (process.env.NODE_ENV !== 'production') {
    // dotenv import still needed in test runtime
    require('dotenv').config({ path: '../../.env' });
}

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

let server;
let creatorId, cityId, categoryId;

const CREATE_EVENT = `...`; // Your full CREATE_EVENT query here
const GET_EVENTS = `...`;   // Your full GET_EVENTS query here
const GET_USERS = `...`;    // Your full GET_USERS query here

beforeAll(async () => {
    await pool.query(`TRUNCATE event, app_user, city, category RESTART IDENTITY CASCADE`);

    const userRes = await pool.query(`
        INSERT INTO app_user (username, email, password_hash, user_uri, profile_picture_url)
        VALUES ('TestUser', 'test@example.com', 'hashed', 'test-user-uri', 'https://example.com/pic.jpg')
            RETURNING user_id
    `);
    creatorId = userRes.rows[0].user_id;

    const cityRes = await pool.query(`
        INSERT INTO city (country, postal_code, name, latitude, longitude, state)
        VALUES ('DE', 10115, 'Berlin', 52.5200, 13.4050, 'Berlin')
            RETURNING city_id
    `);
    cityId = cityRes.rows[0].city_id;

    const catRes = await pool.query(`
        INSERT INTO category (name, description)
        VALUES ('Tech', 'Technology events')
            RETURNING category_id
    `);
    categoryId = catRes.rows[0].category_id;

    server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async () => ({
            pool,
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com',
                        user_uri: 'test-user-uri',
                        profile_picture_url: 'https://example.com/pic.jpg'
                    }
                }
            }
        })
    });
    await server.start();
});

afterAll(async () => {
    try {
        await server?.stop();
        await pool?.end();
    } catch (err) {
        console.error('Error during teardown:', err);
    }
});

describe('GraphQL API with Geocoding (Vitest)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates an event with provided coordinates', async () => {
        const variables = {
            title: "Test Event with Coordinates",
            description: "This is a test event with predefined coordinates",
            date: "2025-07-01",
            time: "18:00",
            cityId,
            address: "Test St 123",
            latitude: 52.52,
            longitude: 13.40,
            categoryId,
            imageUrl: "https://example.com/image.jpg"
        };

        const contextValue = {
            pool,
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com',
                        user_uri: 'test-user-uri',
                        profile_picture_url: 'https://example.com/pic.jpg'
                    }
                }
            }
        };

        const res = await server.executeOperation(
            { query: CREATE_EVENT, variables },
            { contextValue }
        );

        expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event with Coordinates");
        expect(res.body.singleResult.data.createEvent.latitude).toBe(52.52);
        expect(res.body.singleResult.data.createEvent.longitude).toBe(13.40);
        expect(res.body.singleResult.data.createEvent.author.name).toBe("TestUser");

        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('creates an event with geocoding when coordinates are not provided', async () => {
        const mockGeocodeResponse = {
            data: [{
                lat: '48.8566969',
                lon: '2.3514616',
                display_name: 'Paris, France',
                address: {
                    city: 'Paris',
                    country: 'France'
                }
            }]
        };
        mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

        const variables = {
            title: "Test Event with Geocoding",
            description: "This event will be geocoded",
            date: "2025-07-15",
            time: "19:00",
            address: "Champs-Élysées",
            city: "Paris",
            country: "France",
            categoryId
        };

        const contextValue = {
            pool,
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com',
                        user_uri: 'test-user-uri',
                        profile_picture_url: 'https://example.com/pic.jpg'
                    }
                }
            }
        };

        const res = await server.executeOperation(
            { query: CREATE_EVENT, variables },
            { contextValue }
        );

        expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event with Geocoding");
        expect(res.body.singleResult.data.createEvent.latitude).toBe(48.8566969);
        expect(res.body.singleResult.data.createEvent.longitude).toBe(2.3514616);

        expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('handles geocoding failure gracefully', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const variables = {
            title: "Test Event with Failed Geocoding",
            description: "This event will fail geocoding",
            date: "2025-08-15",
            time: "21:00",
            address: "Invalid Address",
            city: "NonexistentCity",
            categoryId
        };

        const contextValue = {
            pool,
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com',
                        user_uri: 'test-user-uri',
                        profile_picture_url: 'https://example.com/pic.jpg'
                    }
                }
            }
        };

        const res = await server.executeOperation(
            { query: CREATE_EVENT, variables },
            { contextValue }
        );

        expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.createEvent.latitude).toBeNull();
        expect(res.body.singleResult.data.createEvent.longitude).toBeNull();

        expect(consoleWarnSpy).toHaveBeenCalledWith('Geocoding failed:', expect.stringContaining('Network error'));

        consoleWarnSpy.mockRestore();
    });

    it('fetches users', async () => {
        const contextValue = {
            pool,
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com',
                        user_uri: 'test-user-uri',
                        profile_picture_url: 'https://example.com/pic.jpg'
                    }
                }
            }
        };

        const res = await server.executeOperation(
            { query: GET_USERS },
            { contextValue }
        );

        expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.userList[0].name).toBe("TestUser");
    });
});
