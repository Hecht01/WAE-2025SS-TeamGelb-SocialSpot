import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EventBox from '$lib/components/EventBox.svelte';
import { isOverlayOpen, eventPickedForDetailView } from '../stores/OverlayStore';

// Mock the stores - create spy functions for the set methods
vi.mock('../stores/OverlayStore', () => ({
    isOverlayOpen: {
        set: vi.fn()
    },
    eventPickedForDetailView: {
        set: vi.fn()
    }
}));

vi.mock('../stores/eventInteractions', () => ({
    createEventActions: vi.fn(() => ({
        isLiked: { subscribe: vi.fn((fn) => { fn(false); return vi.fn(); }) },
        isJoined: { subscribe: vi.fn((fn) => { fn(false); return vi.fn(); }) },
        localLikeCount: { subscribe: vi.fn((fn) => { fn(5); return vi.fn(); }) },
        isLoading: { subscribe: vi.fn((fn) => { fn(false); return vi.fn(); }) },
        toggleLike: vi.fn(),
        toggleJoin: vi.fn()
    }))
}));

vi.mock('../stores/EventStore', () => ({
    eventUpdates: {
        subscribe: vi.fn((fn) => { fn(null); return vi.fn(); })
    }
}));

describe('EventBox.svelte', () => {
    const mockEvent = {
        id: '1',
        title: 'Test Event',
        date: '2025-07-01',
        time: '14:00:00',
        location: 'Test Location',
        address: 'Test Address 123',
        description: 'This is a test event description',
        thumbnail: 'test-image.jpg',
        type: 'Social',
        latitude: 51.5,
        longitude: 10.1,
        likeCount: 5,
        commentCount: 3,
        likedByMe: false,
        attendedByMe: false,
        attendCount: 10,
        author: {
            user_uri: 'user123',
            name: 'Test Author',
            email: 'author@test.com',
            profilePicture: 'default-profile.jpg'
        },
        attendees: {
            user_uri: 'attendee123',
            name: 'Test Attendee',
            email: 'attendee@test.com',
            profilePicture: 'attendee-profile.jpg'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders event information correctly', () => {
        const { getByText, getByAltText } = render(EventBox, { props: { event: mockEvent } });

        expect(getByText('Test Event')).toBeInTheDocument();
        expect(getByText('Test Location')).toBeInTheDocument();
        expect(getByText('This is a test event description')).toBeInTheDocument();
        expect(getByText('2025-07-01; Time: 14:00')).toBeInTheDocument();
        expect(getByAltText('Test Event')).toBeInTheDocument();
    });

    it('displays like count and comment count', () => {
        const { getByText } = render(EventBox, { props: { event: mockEvent } });

        expect(getByText('5')).toBeInTheDocument(); // like count
        expect(getByText('3')).toBeInTheDocument(); // comment count
    });

    it('opens detail view when clicked', async () => {
        const { container } = render(EventBox, { props: { event: mockEvent } });

        const eventBox = container.querySelector('.event-box');
        expect(eventBox).toBeInTheDocument();

        await fireEvent.click(eventBox!);

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(true);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(mockEvent);
    });

    it('opens detail view when Enter key is pressed', async () => {
        const { container } = render(EventBox, { props: { event: mockEvent } });

        const eventBox = container.querySelector('.event-box');
        expect(eventBox).toBeInTheDocument();

        await fireEvent.keyDown(eventBox!, { key: 'Enter' });

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(true);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(mockEvent);
    });

    it('opens detail view when Space key is pressed', async () => {
        const { container } = render(EventBox, { props: { event: mockEvent } });

        const eventBox = container.querySelector('.event-box');
        expect(eventBox).toBeInTheDocument();

        await fireEvent.keyDown(eventBox!, { key: ' ' });

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(true);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(mockEvent);
    });

    it('renders Join/Leave button with correct text', () => {
        const { getByText } = render(EventBox, { props: { event: mockEvent } });

        expect(getByText('Join')).toBeInTheDocument();
    });

    it('handles missing time gracefully', () => {
        const eventWithoutTime = {
            ...mockEvent,
            time: undefined as any // Cast to any to allow undefined for this test
        };
        const { container } = render(EventBox, { props: { event: eventWithoutTime } });

        expect(container).toBeInTheDocument();
    });

    it('truncates long descriptions', () => {
        const eventWithLongDescription = {
            ...mockEvent,
            description: 'This is a very long description that should be truncated when displayed in the event box component to prevent layout issues'
        };

        const { container } = render(EventBox, { props: { event: eventWithLongDescription } });
        const descriptionElement = container.querySelector('.truncate');

        expect(descriptionElement).toBeInTheDocument();
    });
});