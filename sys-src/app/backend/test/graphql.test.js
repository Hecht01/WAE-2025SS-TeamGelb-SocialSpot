import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema.js';
import { resolvers } from '../src/resolvers.js';
import axios from 'axios';
import { gql } from "graphql-tag";

// Mock axios for geocoding tests
vi.mock('axios');
const mockedAxios = axios;

if (process.env.NODE_ENV !== 'production') {
    // dotenv import still needed in test runtime
    require('dotenv').config({ path: '../../.env' });
}

import { pool } from '../src/database.js';

let server;
let creatorId, cityId;

beforeAll(async () => {
    await pool.query(`TRUNCATE event, app_user, city RESTART IDENTITY CASCADE`);

    const userRes = await pool.query(`
        INSERT INTO app_user (username, email, google_auth_id, profile_picture_url)
        VALUES ('TestUser', 'test@example.com', 'test-user-uri', 'https://example.com/pic.jpg')
            RETURNING user_id
    `);
    creatorId = userRes.rows[0].user_id;

    const cityRes = await pool.query(`
        INSERT INTO city (country, postal_code, name, latitude, longitude, state, district)
        VALUES ('DE', 10115, 'Berlin', 52.5200, 13.4050, 'Berlin', 'Berlin')
            RETURNING city_id
    `);
    cityId = cityRes.rows[0].city_id;

    server = new ApolloServer({
        typeDefs,
        resolvers,
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

    it('creates an event with geocoding', async () => {
        // Mock successful geocoding response
        const mockGeocodeResponse = {
            data: [{
                lat: '52.5000',
                lon: '13.4000',
                display_name: 'Berlin, Germany'
            }]
        };
        mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

        const CREATE_EVENT = gql`
            mutation CreateEvent(
                $title: String!,
                $description: String!,
                $date: String!,
                $time: String!,
                $cityId: Int!,
                $address: String,
                $imageUrl: String
            ) {
                createEvent(
                    title: $title,
                    description: $description,
                    date: $date,
                    time: $time,
                    cityId: $cityId,
                    address: $address,
                    imageUrl: $imageUrl
                )
            }
        `;

        const variables = {
            title: "Test Event with Geocoding",
            description: "This is a test event",
            date: "2025-07-01",
            time: "18:00",
            cityId: cityId,
            address: "Test St 123"
        };

        const mockContext = {
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

        const response = await server.executeOperation(
            {
                query: CREATE_EVENT,
                variables
            },
            {
                contextValue: mockContext
            }
        );

        expect(response.body.kind).toBe('single');
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data.createEvent).toBeDefined();

        // Verify that geocoding was called
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://nominatim.openstreetmap.org/search',
            expect.objectContaining({
                params: expect.objectContaining({
                    q: expect.stringContaining('Test St 123'),
                    format: 'json'
                })
            })
        );
    });

    it('handles geocoding failure gracefully', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock geocoding failure
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const CREATE_EVENT = gql`
            mutation CreateEvent(
                $title: String!,
                $description: String!,
                $date: String!,
                $time: String!,
                $cityId: Int!,
                $address: String
            ) {
                createEvent(
                    title: $title,
                    description: $description,
                    date: $date,
                    time: $time,
                    cityId: $cityId,
                    address: $address
                )
            }
        `;

        const variables = {
            title: "Test Event with Failed Geocoding",
            description: "This event will fail geocoding",
            date: "2025-08-15",
            time: "21:00",
            cityId: cityId,
            address: "Invalid Address"
        };

        const mockContext = {
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

        const response = await server.executeOperation(
            {
                query: CREATE_EVENT,
                variables
            },
            {
                contextValue: mockContext
            }
        );

        expect(response.body.kind).toBe('single');
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors[0].message).toContain('Invalid Address provided');

        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('fetches event list', async () => {
        // First create an event to fetch
        await pool.query(`
            INSERT INTO event (title, description, event_date, event_time, creator_id, city_id, address, latitude, longitude)
            VALUES ('Sample Event', 'Sample Description', '2025-07-01', '18:00', $1, $2, 'Sample Address', 52.5, 13.4)
        `, [creatorId, cityId]);

        const GET_EVENTS = gql`
            query GetEvents {
                eventList {
                    id
                    title
                    description
                    date
                    time
                    location
                    address
                    author {
                        name
                        email
                    }
                    likeCount
                    attendCount
                    commentCount
                }
            }
        `;

        const mockContext = {
            req: {
                session: {
                    user: {
                        user_id: creatorId,
                        username: 'TestUser',
                        email: 'test@example.com'
                    }
                }
            }
        };

        const response = await server.executeOperation(
            {
                query: GET_EVENTS
            },
            {
                contextValue: mockContext
            }
        );

        expect(response.body.kind).toBe('single');
        expect(response.body.singleResult.data.eventList).toBeDefined();
    });

    it('fetches users', async () => {
        const GET_USERS = gql`
            query GetUsers {
                userList {
                    name
                    email
                    profilePicture
                }
            }
        `;

        const response = await server.executeOperation({
            query: GET_USERS
        });

        expect(response.body.kind).toBe('single');
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data.userList).toBeDefined();
        expect(response.body.singleResult.data.userList.length).toBeGreaterThan(0);
        expect(response.body.singleResult.data.userList[0].name).toBe("TestUser");
        expect(response.body.singleResult.data.userList[0].email).toBe("test@example.com");
    });

    it('requires authentication for myUser query', async () => {
        const GET_MY_USER = gql`
            query GetMyUser {
                myUser {
                    user_uri
                    name
                    email
                    profilePicture
                }
            }
        `;

        // Test without authentication
        const responseUnauth = await server.executeOperation({
            query: GET_MY_USER
        });

        expect(responseUnauth.body.kind).toBe('single');
        expect(responseUnauth.body.singleResult.errors).toBeDefined();

        // Test with authentication
        const mockContext = {
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

        const responseAuth = await server.executeOperation(
            {
                query: GET_MY_USER
            },
            {
                contextValue: mockContext
            }
        );

        expect(responseAuth.body.kind).toBe('single');
        expect(responseAuth.body.singleResult.errors).toBeUndefined();
        expect(responseAuth.body.singleResult.data.myUser.name).toBe('TestUser');
        expect(responseAuth.body.singleResult.data.myUser.email).toBe('test@example.com');
    });

    it('fetches cities with name filter', async () => {
        const GET_CITIES = gql`
            query GetCities($nameLike: String) {
                getCities(nameLike: $nameLike) {
                    id
                    name
                    district
                    state
                }
            }
        `;

        const response = await server.executeOperation({
            query: GET_CITIES,
            variables: { nameLike: "Ber" }
        });

        expect(response.body.kind).toBe('single');
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data.getCities).toBeDefined();
        expect(response.body.singleResult.data.getCities.length).toBeGreaterThan(0);
        expect(response.body.singleResult.data.getCities[0].name).toBe("Berlin");
    });
});