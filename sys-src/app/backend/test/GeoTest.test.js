const request = require('supertest');
const axios = require('axios');
const app = require('./index');

jest.mock('axios');
const mockedAxios = axios;

describe('POST /geocode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Successful geocoding', () => {
        it('should geocode a valid address with all fields', async () => {
            const mockResponse = {
                data: [{
                    lat: '40.7127281',
                    lon: '-74.0060152',
                    display_name: 'New York, NY, United States',
                    address: {
                        city: 'New York',
                        state: 'New York',
                        country: 'United States'
                    }
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    country: 'USA'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                query: '123 Main Street, New York, NY, USA',
                coordinates: {
                    latitude: 40.7127281,
                    longitude: -74.0060152
                },
                display_name: 'New York, NY, United States',
                address_details: {
                    city: 'New York',
                    state: 'New York',
                    country: 'United States'
                }
            });

            // Verify the axios call was made with correct parameters
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://nominatim.openstreetmap.org/search',
                {
                    params: {
                        q: '123 Main Street, New York, NY, USA',
                        format: 'json',
                        limit: 1,
                        addressdetails: 1
                    },
                    headers: {
                        'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
                    }
                }
            );
        });

        it('should geocode with only address field', async () => {
            const mockResponse = {
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

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'Paris'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.query).toBe('Paris');
            expect(response.body.coordinates.latitude).toBe(48.8566969);
            expect(response.body.coordinates.longitude).toBe(2.3514616);
        });

        it('should build query string with partial fields', async () => {
            const mockResponse = {
                data: [{
                    lat: '34.0522265',
                    lon: '-118.2436596',
                    display_name: 'Los Angeles, CA, United States',
                    address: {}
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'Hollywood Blvd',
                    city: 'Los Angeles',
                    state: 'CA'
                    // No country field
                });

            expect(response.status).toBe(200);
            expect(response.body.query).toBe('Hollywood Blvd, Los Angeles, CA');

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://nominatim.openstreetmap.org/search',
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'Hollywood Blvd, Los Angeles, CA'
                    })
                })
            );
        });
    });

    describe('Error handling', () => {
        it('should return 400 when address is missing', async () => {
            const response = await request(app)
                .post('/geocode')
                .send({
                    city: 'New York',
                    state: 'NY'
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Address field is required in request body'
            });

            // Verify no API call was made
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });

        it('should return 400 when address is empty string', async () => {
            const response = await request(app)
                .post('/geocode')
                .send({
                    address: '',
                    city: 'New York'
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Address field is required in request body'
            });
        });

        it('should return 404 when address is not found', async () => {
            const mockResponse = {
                data: [] // Empty results
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'NonexistentPlace12345',
                    city: 'FakeCity'
                });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: 'Address not found',
                query: 'NonexistentPlace12345, FakeCity'
            });
        });

        it('should return 404 when API returns null data', async () => {
            const mockResponse = {
                data: null
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'Test Address'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Address not found');
        });

        it('should return 500 when axios throws an error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            mockedAxios.get.mockRejectedValue(new Error('Network error'));

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'Test Address'
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Internal server error during geocoding'
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Geocoding error:', 'Network error');

            consoleErrorSpy.mockRestore();
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/geocode')
                .send('invalid json');

            expect(response.status).toBe(400);
        });
    });

    describe('Data type handling', () => {
        it('should handle numeric coordinates correctly', async () => {
            const mockResponse = {
                data: [{
                    lat: '40.7127281',
                    lon: '-74.0060152',
                    display_name: 'Test Location',
                    address: {}
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'Test Address'
                });

            expect(response.status).toBe(200);
            expect(typeof response.body.coordinates.latitude).toBe('number');
            expect(typeof response.body.coordinates.longitude).toBe('number');
            expect(response.body.coordinates.latitude).toBe(40.7127281);
            expect(response.body.coordinates.longitude).toBe(-74.0060152);
        });

        it('should handle string coordinates and parse to numbers', async () => {
            const mockResponse = {
                data: [{
                    lat: '51.5074',
                    lon: '-0.1278',
                    display_name: 'London, UK',
                    address: {}
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/geocode')
                .send({
                    address: 'London'
                });

            expect(response.status).toBe(200);
            expect(response.body.coordinates.latitude).toBe(51.5074);
            expect(response.body.coordinates.longitude).toBe(-0.1278);
        });
    });

    describe('Request parameters', () => {
        it('should send correct headers to Nominatim API', async () => {
            const mockResponse = {
                data: [{
                    lat: '40.7127281',
                    lon: '-74.0060152',
                    display_name: 'Test',
                    address: {}
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await request(app)
                .post('/geocode')
                .send({
                    address: 'Test Address'
                });

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://nominatim.openstreetmap.org/search',
                expect.objectContaining({
                    headers: {
                        'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
                    }
                })
            );
        });

        it('should send correct query parameters to Nominatim API', async () => {
            const mockResponse = {
                data: [{
                    lat: '40.7127281',
                    lon: '-74.0060152',
                    display_name: 'Test',
                    address: {}
                }]
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await request(app)
                .post('/geocode')
                .send({
                    address: 'Test Address'
                });

            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://nominatim.openstreetmap.org/search',
                expect.objectContaining({
                    params: {
                        q: 'Test Address',
                        format: 'json',
                        limit: 1,
                        addressdetails: 1
                    }
                })
            );
        });
    });
});