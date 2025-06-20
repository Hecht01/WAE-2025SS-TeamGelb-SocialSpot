import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EventFeed from '$lib/components/EventFeed.svelte';

// Mock EventBox component
vi.mock('$lib/components/EventBox.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: 'mocked-event-box' } }))
}));

describe('EventFeed.svelte', () => {
    const mockEvents = [
        {
            id: '1',
            title: 'Event 1',
            date: '2025-07-01',
            time: '14:00:00',
            location: 'Location 1',
            address: 'Address 1',
            description: 'Description 1',
            thumbnail: 'image1.jpg',
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
                name: 'Author 1',
                email: 'author1@test.com',
                profilePicture: 'default-profile.jpg'
            },
            attendees: {
                user_uri: 'attendee1',
                name: 'Test Attendee 1',
                email: 'attendee1@test.com',
                profilePicture: 'attendee1-profile.jpg'
            }
        },
        {
            id: '2',
            title: 'Event 2',
            date: '2025-07-02',
            time: '16:00:00',
            location: 'Location 2',
            address: 'Address 2',
            description: 'Description 2',
            thumbnail: 'image2.jpg',
            type: 'Cultural',
            latitude: 52.5,
            longitude: 11.1,
            likeCount: 10,
            commentCount: 4,
            likedByMe: true,
            attendedByMe: true,
            attendCount: 20,
            author: {
                user_uri: 'user2',
                name: 'Author 2',
                email: 'author2@test.com',
                profilePicture: 'author2-profile.jpg'
            },
            attendees: {
                user_uri: 'attendee2',
                name: 'Test Attendee 2',
                email: 'attendee2@test.com',
                profilePicture: 'attendee2-profile.jpg'
            }
        }
    ];

    it('renders without crashing', () => {
        const { container } = render(EventFeed, { props: { events: [] } });
        expect(container).toBeInTheDocument();
    });

    it('renders the correct grid layout', () => {
        const { container } = render(EventFeed, { props: { events: mockEvents } });

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toBeInTheDocument();
        expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'gap-6', 'p-4', 'max-w-6xl', 'mx-auto');
    });

    it('renders empty state when no events', () => {
        const { container } = render(EventFeed, { props: { events: [] } });

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toBeInTheDocument();
        expect(gridContainer!.children).toHaveLength(0);
    });

    it('handles undefined events array', () => {
        const { container } = render(EventFeed, { props: { events: undefined as any } });
        expect(container).toBeInTheDocument();
    });

    it('applies responsive grid classes correctly', () => {
        const { container } = render(EventFeed, { props: { events: mockEvents } });

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('grid-cols-1'); // Mobile: 1 column
        expect(gridContainer).toHaveClass('md:grid-cols-2'); // Medium screens: 2 columns
    });

    it('applies correct spacing and layout classes', () => {
        const { container } = render(EventFeed, { props: { events: mockEvents } });

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('gap-6'); // Gap between items
        expect(gridContainer).toHaveClass('p-4'); // Padding
        expect(gridContainer).toHaveClass('max-w-6xl'); // Max width
        expect(gridContainer).toHaveClass('mx-auto'); // Center horizontally
    });
});