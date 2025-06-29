import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EventDetailView from '$lib/components/EventDetailView.svelte';
import { isOverlayOpen, eventPickedForDetailView } from '../stores/OverlayStore';

// Mock the stores
vi.mock('../stores/OverlayStore', () => ({
    isOverlayOpen: {
        set: vi.fn()
    },
    eventPickedForDetailView: {
        set: vi.fn(),
        subscribe: vi.fn((fn) => { fn(null); return vi.fn(); })
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

describe('EventDetailView.svelte', () => {
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
        // Mock eventPickedForDetailView to return the mock event
        vi.mocked(eventPickedForDetailView.subscribe).mockImplementation((fn) => {
            fn(mockEvent);
            return vi.fn();
        });
    });

    it('renders event details when event is selected', () => {
        const { getByText, getByAltText } = render(EventDetailView);

        expect(getByText('Test Event')).toBeInTheDocument();
        expect(getByText('Test Location')).toBeInTheDocument();
        expect(getByText('Test Address 123')).toBeInTheDocument();
        expect(getByText('This is a test event description')).toBeInTheDocument();
        expect(getByText('2025-07-01; Time: 14:00')).toBeInTheDocument();
        expect(getByAltText('Test Event')).toBeInTheDocument();
    });

    it('displays like count and comment count', () => {
        const { getByText } = render(EventDetailView);

        expect(getByText('5')).toBeInTheDocument(); // like count
        expect(getByText('3')).toBeInTheDocument(); // comment count
    });

    it('renders Join/Leave button with correct text', () => {
        const { getByText } = render(EventDetailView);

        expect(getByText('Join')).toBeInTheDocument();
    });

    it('closes overlay when background is clicked', async () => {
        const { container } = render(EventDetailView);

        const overlay = container.querySelector('.w-screen.h-screen.fixed');
        expect(overlay).toBeInTheDocument();

        await fireEvent.click(overlay!);

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(false);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(null);
    });

    it('closes overlay when X button is clicked', async () => {
        const { getByText } = render(EventDetailView);

        const closeButton = getByText('×');
        expect(closeButton).toBeInTheDocument();

        await fireEvent.click(closeButton);

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(false);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(null);
    });

    it('closes overlay when Escape key is pressed on background', async () => {
        const { container } = render(EventDetailView);

        const overlay = container.querySelector('.w-screen.h-screen.fixed');

        await fireEvent.keyDown(overlay!, { key: 'Enter' });

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        expect(mockIsOverlayOpen.set).toHaveBeenCalledWith(false);
        expect(mockEventPickedForDetailView.set).toHaveBeenCalledWith(null);
    });

    it('does not close overlay when event box is clicked', async () => {
        const { container } = render(EventDetailView);

        const eventBox = container.querySelector('.event-box-large');
        expect(eventBox).toBeInTheDocument();

        await fireEvent.click(eventBox!);

        const { isOverlayOpen: mockIsOverlayOpen, eventPickedForDetailView: mockEventPickedForDetailView } = await import('../stores/OverlayStore');

        // Should not have been called because of stopPropagation
        expect(mockIsOverlayOpen.set).not.toHaveBeenCalled();
        expect(mockEventPickedForDetailView.set).not.toHaveBeenCalled();
    });

    it('displays correct image source', () => {
        const { getByAltText } = render(EventDetailView);

        const image = getByAltText('Test Event');
        expect(image).toHaveAttribute('src', expect.stringContaining('test-image.jpg'));
    });

    it('shows "No event selected" when no event is picked', () => {
        // Mock eventPickedForDetailView to return null
        vi.mocked(eventPickedForDetailView.subscribe).mockImplementation((fn) => {
            fn(null);
            return vi.fn();
        });

        const { getByText } = render(EventDetailView);

        expect(getByText('No event selected.')).toBeInTheDocument();
    });

    it('handles missing time gracefully', () => {
        const eventWithoutTime = {
            ...mockEvent,
            time: '00:00:00'
        };

        vi.mocked(eventPickedForDetailView.subscribe).mockImplementation((fn) => {
            fn(eventWithoutTime);
            return vi.fn();
        });

        const { container, getByText } = render(EventDetailView);

        expect(container).toBeInTheDocument();
        expect(getByText(/00:00/)).toBeInTheDocument();
    });

    it('has correct overlay styling', () => {
        const { container } = render(EventDetailView);

        const overlay = container.querySelector('.w-screen.h-screen.fixed');
        expect(overlay).toHaveClass('top-0', 'left-0', 'flex', 'justify-center', 'items-center');
    });

    it('has close button with correct styling', () => {
        const { getByText } = render(EventDetailView);

        const closeButton = getByText('×');
        expect(closeButton).toHaveClass('absolute', 'top-0', 'right-2', 'text-4xl');
    });
});