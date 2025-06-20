import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { createEventActions } from './eventInteractions.js';

// Mock the EventStore
vi.mock('./EventStore.js', () => ({
    eventStoreActions: {
        updateEventLike: vi.fn(),
        updateEventJoin: vi.fn()
    }
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock alert with proper typing
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('eventInteractions.js', () => {
    const mockEvent = {
        id: 'event-123',
        title: 'Test Event',
        likeCount: 10,
        likedByMe: false,
        attendedByMe: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
        mockAlert.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createEventActions', () => {
        it('creates actions with correct initial values', () => {
            const actions = createEventActions(mockEvent);

            expect(get(actions.isLiked)).toBe(false);
            expect(get(actions.isJoined)).toBe(false);
            expect(get(actions.localLikeCount)).toBe(10);
            expect(get(actions.isLoading)).toBe(false);
        });

        it('initializes with event values when provided', () => {
            const likedEvent = {
                ...mockEvent,
                likedByMe: true,
                attendedByMe: true,
                likeCount: 15
            };

            const actions = createEventActions(likedEvent);

            expect(get(actions.isLiked)).toBe(true);
            expect(get(actions.isJoined)).toBe(true);
            expect(get(actions.localLikeCount)).toBe(15);
        });

        it('handles missing event properties gracefully', () => {
            const minimalEvent = { id: 'test' };

            const actions = createEventActions(minimalEvent);

            expect(get(actions.isLiked)).toBe(false);
            expect(get(actions.isJoined)).toBe(false);
            expect(get(actions.localLikeCount)).toBe(0);
            expect(get(actions.isLoading)).toBe(false);
        });
    });

    describe('toggleLike', () => {
        it('successfully likes an event', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { likeEvent: true } })
            });

            const actions = createEventActions(mockEvent);

            await actions.toggleLike();

            expect(get(actions.isLiked)).toBe(true);
            expect(get(actions.localLikeCount)).toBe(11);
            expect(get(actions.isLoading)).toBe(false);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/graphql'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: expect.stringContaining('likeEvent')
                })
            );
        });

        it('successfully unlikes an event', async () => {
            const likedEvent = { ...mockEvent, likedByMe: true, likeCount: 15 };

            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { removeLikeEvent: true } })
            });

            const actions = createEventActions(likedEvent);

            await actions.toggleLike();

            expect(get(actions.isLiked)).toBe(false);
            expect(get(actions.localLikeCount)).toBe(14);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/graphql'),
                expect.objectContaining({
                    body: expect.stringContaining('removeLikeEvent')
                })
            );
        });

        it('handles like API errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const actions = createEventActions(mockEvent);

            await actions.toggleLike();

            // Should revert to original state
            expect(get(actions.isLiked)).toBe(false);
            expect(get(actions.localLikeCount)).toBe(10);
            expect(get(actions.isLoading)).toBe(false);
            expect(global.alert).toHaveBeenCalledWith('Failed to update like status. Please try again');
        });

        it('handles GraphQL errors', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({
                    errors: [{ message: 'GraphQL error occurred' }]
                })
            });

            const actions = createEventActions(mockEvent);

            await actions.toggleLike();

            expect(get(actions.isLiked)).toBe(false);
            expect(get(actions.localLikeCount)).toBe(10);
            expect(global.alert).toHaveBeenCalledWith('Failed to update like status. Please try again');
        });

        it('sets loading state during API call', async () => {
            let resolvePromise: ((value: any) => void) | undefined;
            const pendingPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(pendingPromise);

            const actions = createEventActions(mockEvent);

            // Start the async operation
            const togglePromise = actions.toggleLike();

            // Wait for next tick to ensure loading state is set
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should be loading
            expect(get(actions.isLoading)).toBe(true);

            // TypeScript-sichere Verwendung mit Non-Null-Assertion
            resolvePromise!({
                json: async () => ({ data: { likeEvent: true } })
            });

            await togglePromise;

            // Should not be loading anymore
            expect(get(actions.isLoading)).toBe(false);
        });
    });

    describe('toggleJoin', () => {
        it('successfully joins an event', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { attendEvent: true } })
            });

            const actions = createEventActions(mockEvent);

            await actions.toggleJoin();

            expect(get(actions.isJoined)).toBe(true);
            expect(get(actions.isLoading)).toBe(false);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/graphql'),
                expect.objectContaining({
                    body: expect.stringContaining('attendEvent')
                })
            );
        });

        it('successfully leaves an event', async () => {
            const joinedEvent = { ...mockEvent, attendedByMe: true };

            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { leaveEvent: true } })
            });

            const actions = createEventActions(joinedEvent);

            await actions.toggleJoin();

            expect(get(actions.isJoined)).toBe(false);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/graphql'),
                expect.objectContaining({
                    body: expect.stringContaining('leaveEvent')
                })
            );
        });

        it('handles join API errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const actions = createEventActions(mockEvent);

            await actions.toggleJoin();

            // Should revert to original state
            expect(get(actions.isJoined)).toBe(false);
            expect(get(actions.isLoading)).toBe(false);
            expect(global.alert).toHaveBeenCalledWith('Failed to update attendance status. Please try again');
        });

        it('handles authentication errors specifically', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Authentication required'));

            const actions = createEventActions(mockEvent);

            await actions.toggleJoin();

            expect(get(actions.isJoined)).toBe(false);
            expect(global.alert).toHaveBeenCalledWith('Please log in to join/leave events');
        });

        it('sets loading state during API call', async () => {
            let resolvePromise: ((value: any) => void) | undefined;
            const pendingPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(pendingPromise);

            const actions = createEventActions(mockEvent);

            // Start the async operation
            const togglePromise = actions.toggleJoin();

            // Wait for next tick to ensure loading state is set
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should be loading
            expect(get(actions.isLoading)).toBe(true);

            // TypeScript-sichere Verwendung mit Non-Null-Assertion
            resolvePromise!({
                json: async () => ({ data: { attendEvent: true } })
            });

            await togglePromise;

            // Should not be loading anymore
            expect(get(actions.isLoading)).toBe(false);
        });
    });

    describe('API communication', () => {
        it('sends correct GraphQL mutation for liking', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { likeEvent: true } })
            });

            const actions = createEventActions(mockEvent);
            await actions.toggleLike();

            const fetchCall = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody.query).toContain('mutation LikeEvent');
            expect(requestBody.variables).toEqual({ id: 'event-123' });
        });

        it('sends correct GraphQL mutation for attending', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { attendEvent: true } })
            });

            const actions = createEventActions(mockEvent);
            await actions.toggleJoin();

            const fetchCall = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody.query).toContain('mutation AttendEvent');
            expect(requestBody.variables).toEqual({ id: 'event-123' });
        });

        it('includes credentials in requests', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { likeEvent: true } })
            });

            const actions = createEventActions(mockEvent);
            await actions.toggleLike();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    credentials: 'include'
                })
            );
        });
    });

    describe('store integration', () => {
        it('updates EventStore after successful like', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { likeEvent: true } })
            });

            const { eventStoreActions } = await import('./EventStore.js');
            const actions = createEventActions(mockEvent);

            await actions.toggleLike();

            expect(eventStoreActions.updateEventLike).toHaveBeenCalledWith(
                'event-123',
                true,
                11
            );
        });

        it('updates EventStore after successful join', async () => {
            mockFetch.mockResolvedValueOnce({
                json: async () => ({ data: { attendEvent: true } })
            });

            const { eventStoreActions } = await import('./EventStore.js');
            const actions = createEventActions(mockEvent);

            await actions.toggleJoin();

            expect(eventStoreActions.updateEventJoin).toHaveBeenCalledWith(
                'event-123',
                true
            );
        });
    });
});