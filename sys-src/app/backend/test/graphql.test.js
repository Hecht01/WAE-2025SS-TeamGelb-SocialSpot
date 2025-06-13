import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import {typeDefs} from '../src/schema.js';
import { resolvers } from '../src/resolvers.js';
import { Pool } from 'pg';
import axios from 'axios';

// Mock axios for geocoding tests
jest.mock('axios');
const mockedAxios = axios;

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
  $cityId: Int,
  $address: String,
  $latitude: Float,
  $longitude: Float,
  $categoryId: Int,
  $imageUrl: String,
  $city: String,
  $state: String,
  $country: String
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
    categoryId: $categoryId,
    imageUrl: $imageUrl,
    city: $city,
    state: $state,
    country: $country
  ) {
    id
    title
    latitude
    longitude
    address
    author {
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
    latitude
    longitude
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
        `INSERT INTO app_user (username, email, password_hash, user_uri, profile_picture_url)
     VALUES ('TestUser', 'test@example.com', 'hashed', 'test-user-uri', 'https://example.com/pic.jpg')
     RETURNING user_id`
    );
    creatorId = userRes.rows[0].user_id;

    const cityRes = await pool.query(
        `INSERT INTO city (country, postal_code, name, latitude, longitude, state)
     VALUES ('DE', 10115, 'Berlin', 52.5200, 13.4050, 'Berlin')
     RETURNING city_id`
    );
    cityId = cityRes.rows[0].city_id;

    const catRes = await pool.query(
        `INSERT INTO category (name, description)
     VALUES ('Tech', 'Technology events')
     RETURNING category_id`
    );
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
        await server?.stop(); // Gracefully stop Apollo Server
        await pool?.end();    // Close PostgreSQL pool
    } catch (err) {
        console.error('Error during teardown:', err);
    }
});

describe('GraphQL API with Geocoding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

        // Verify no geocoding API call was made since coordinates were provided
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

        // Verify geocoding API was called
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://nominatim.openstreetmap.org/search',
            {
                params: {
                    q: 'Champs-Élysées, Paris, France',
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'SocialSpot/1.0'
                }
            }
        );
    });

    it('creates an event with geocoding using cityId from database', async () => {
        const mockGeocodeResponse = {
            data: [{
                lat: '52.5200066',
                lon: '13.4049540',
                display_name: 'Berlin, Germany',
                address: {
                    city: 'Berlin',
                    country: 'Germany'
                }
            }]
        };

        mockedAxios.get.mockResolvedValue(mockGeocodeResponse);

        const variables = {
            title: "Test Event with CityId Geocoding",
            description: "This event uses cityId for geocoding",
            date: "2025-08-01",
            time: "20:00",
            cityId: cityId,
            address: "Brandenburger Tor",
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
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event with CityId Geocoding");
        expect(res.body.singleResult.data.createEvent.latitude).toBe(52.5200066);
        expect(res.body.singleResult.data.createEvent.longitude).toBe(13.4049540);

        // Verify geocoding API was called with city name from database
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://nominatim.openstreetmap.org/search',
            {
                params: {
                    q: 'Brandenburger Tor, Berlin, Berlin',
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'SocialSpot/1.0'
                }
            }
        );
    });

    it('handles geocoding failure gracefully', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

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
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event with Failed Geocoding");
        expect(res.body.singleResult.data.createEvent.latitude).toBeNull();
        expect(res.body.singleResult.data.createEvent.longitude).toBeNull();

        expect(consoleWarnSpy).toHaveBeenCalledWith('Geocoding failed:', expect.stringContaining('Network error'));

        consoleWarnSpy.mockRestore();
    });

    it('handles empty geocoding results', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        mockedAxios.get.mockResolvedValue({ data: [] });

        const variables = {
            title: "Test Event with No Geocoding Results",
            description: "This event will get no geocoding results",
            date: "2025-09-01",
            time: "22:00",
            address: "Unknown Location",
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
        expect(res.body.singleResult.data.createEvent.title).toBe("Test Event with No Geocoding Results");
        expect(res.body.singleResult.data.createEvent.latitude).toBeNull();
        expect(res.body.singleResult.data.createEvent.longitude).toBeNull();

        expect(consoleWarnSpy).toHaveBeenCalledWith('Geocoding failed:', expect.stringContaining('Address not found'));

        consoleWarnSpy.mockRestore();
    });

    it('fetches events with coordinates', async () => {
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
            { query: GET_EVENTS },
            { contextValue }
        );

        expect(res.body.singleResult.errors).toBeUndefined();
        expect(res.body.singleResult.data.eventList.length).toBeGreaterThan(0);

        // Check that events have coordinate data
        const eventsWithCoords = res.body.singleResult.data.eventList.filter(event =>
            event.latitude !== null && event.longitude !== null
        );
        expect(eventsWithCoords.length).toBeGreaterThan(0);
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