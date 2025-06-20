import { render, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from './+page.svelte';

// Mock the EventFeed component
vi.mock('$lib/components/EventFeed.svelte', () => ({
	default: vi.fn(() => ({ $$: { fragment: 'mocked-event-feed' } }))
}));

// Mock the stores
vi.mock('../stores/EventStore.js', () => ({
	globalEvents: {
		subscribe: vi.fn((fn) => fn([]))
	},
	eventStoreActions: {
		setEvents: vi.fn()
	}
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.mock('$env/static/private', () => ({
	VITE_API_URL: 'http://localhost:4000'
}));

describe('Main +page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockClear();
	});

	it('shows loading state initially', () => {
		// Mock a pending fetch
		mockFetch.mockImplementation(() => new Promise(() => {}));

		const { getByText, container } = render(Page);

		expect(getByText('Loading...')).toBeInTheDocument();

		// Check for loading spinner
		const spinner = container.querySelector('.animate-spin');
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-[#541a46]');
	});

	it('displays error message when fetch fails', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const { getByText } = render(Page);

		await waitFor(() => {
			expect(getByText('Error while Loading: Network error')).toBeInTheDocument();
		});
	});

	it('renders EventFeed when data loads successfully', async () => {
		const mockEvents = [
			{
				id: '1',
				title: 'Test Event',
				description: 'Test Description',
				date: '2025-07-01',
				time: '14:00',
				location: 'Test Location',
				address: 'Test Address',
				thumbnail: 'test.jpg',
				type: 'Social',
				latitude: 51.5,
				longitude: 10.1,
				likeCount: 5,
				commentCount: 2,
				likedByMe: false,
				attendedByMe: false,
				attendCount: 10,
				author: {
					user_uri: 'user1',
					name: 'Test Author',
					email: 'author@test.com',
					profilePicture: '/test-avatar.jpg'
				},
				attendees: []
			}
		];

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: {
					eventList: mockEvents
				}
			})
		});

		const { container } = render(Page);

		await waitFor(() => {
			// Should not show loading or error
			expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
			expect(container.textContent).not.toContain('Loading...');
			expect(container.textContent).not.toContain('Error while Loading');
		});
	});

	it('makes correct GraphQL request', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: {
					eventList: []
				}
			})
		});

		render(Page);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:4000/graphql',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: expect.stringContaining('"query"')
				})
			);
		});

		// Check that the GraphQL query contains the expected fields
		const fetchCall = mockFetch.mock.calls[0];
		const requestBody = JSON.parse(fetchCall[1].body);
		expect(requestBody.query).toContain('eventList');
		expect(requestBody.query).toContain('id');
		expect(requestBody.query).toContain('title');
		expect(requestBody.query).toContain('author');
	});

	it('has correct loading state structure', () => {
		mockFetch.mockImplementation(() => new Promise(() => {}));

		const { container } = render(Page);

		const loadingContainer = container.querySelector('.sosp-fullscreen-center');
		expect(loadingContainer).toBeInTheDocument();

		const eventBox = loadingContainer?.querySelector('.event-box');
		expect(eventBox).toBeInTheDocument();

		const contentContainer = eventBox?.querySelector('.sosp-center-content');
		expect(contentContainer).toBeInTheDocument();
	});

	it('uses correct API URL from environment', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: {
					eventList: []
				}
			})
		});

		render(Page);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('http://localhost:4000/graphql'),
				expect.any(Object)
			);
		});
	});

	it('handles empty event list', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				data: {
					eventList: []
				}
			})
		});

		const { container } = render(Page);

		await waitFor(() => {
			expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
			expect(container.textContent).not.toContain('Loading...');
		});
	});
});