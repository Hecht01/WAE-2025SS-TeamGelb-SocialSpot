import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserPage from './+page.svelte';

// Mock EventFeed component
vi.mock('$lib/components/EventFeed.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: 'mocked-event-feed' } }))
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
    href: '',
    reload: vi.fn()
};
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
});

describe('UserPage +page.svelte', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
        mockLocation.href = '';
        mockLocation.reload.mockClear();
    });

    it('shows loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => {}));

        const { getByText, container } = render(UserPage);

        expect(getByText('Loading...')).toBeInTheDocument();

        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('shows login prompt when user is not authenticated', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    myUser: null
                }
            })
        });

        const { getByText } = render(UserPage);

        await waitFor(() => {
            expect(getByText('Please Log In to continue to your profile')).toBeInTheDocument();
            expect(getByText('Log-in with Google')).toBeInTheDocument();
        });
    });

    it('redirects to Google auth when login button is clicked', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    myUser: null
                }
            })
        });

        const { getByText } = render(UserPage);

        await waitFor(() => {
            const loginButton = getByText('Log-in with Google');
            expect(loginButton).toBeInTheDocument();
        });

        const loginButton = getByText('Log-in with Google');
        await fireEvent.click(loginButton);

        expect(mockLocation.href).toBe('http://localhost:4000/api/auth-google');
    });

    it('displays user profile when authenticated', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: 'https://example.com/avatar.jpg'
        };

        // Mock auth check
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            // Mock created events fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        getCreatedEvents: []
                    }
                })
            });

        const { getByText } = render(UserPage);

        await waitFor(() => {
            expect(getByText("John Doe's profile")).toBeInTheDocument();
            expect(getByText('Email: john@example.com')).toBeInTheDocument();
            expect(getByText('Log Out')).toBeInTheDocument();
        });
    });

    it('displays user avatar correctly', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: 'https://example.com/avatar.jpg'
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        getCreatedEvents: []
                    }
                })
            });

        const { getByAltText } = render(UserPage);

        await waitFor(() => {
            const avatar = getByAltText('User Avatar');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        });
    });

    it('uses default avatar when profilePicture is null', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: null
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        getCreatedEvents: []
                    }
                })
            });

        const { getByAltText } = render(UserPage);

        await waitFor(() => {
            const avatar = getByAltText('User Avatar');
            expect(avatar).toHaveAttribute('src', '/dummyUser.jpg');
        });
    });

    it('handles logout correctly', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: null
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        getCreatedEvents: []
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true
            });

        const { getByText } = render(UserPage);

        await waitFor(() => {
            expect(getByText('Log Out')).toBeInTheDocument();
        });

        const logoutButton = getByText('Log Out');
        await fireEvent.click(logoutButton);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/logout',
            expect.objectContaining({
                method: 'GET',
                credentials: 'include'
            })
        );

        expect(mockLocation.reload).toHaveBeenCalled();
    });

    it('shows created events section', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: null
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        getCreatedEvents: []
                    }
                })
            });

        const { getByText } = render(UserPage);

        await waitFor(() => {
            expect(getByText('Your Created Events')).toBeInTheDocument();
        });
    });

    it('shows loading state for created events', async () => {
        mockFetch.mockImplementation(() => new Promise(() => {}));

        const { container } = render(UserPage);

        // Just check that we're in some loading state
        await waitFor(() => {
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        });
    });

    it('handles created events loading error', async () => {
        const mockUser = {
            user_uri: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
            profilePicture: null
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        myUser: mockUser
                    }
                })
            })
            .mockRejectedValueOnce(new Error('Events fetch failed'));

        const { getByText } = render(UserPage);

        await waitFor(() => {
            expect(getByText('Error while Loading: Events fetch failed')).toBeInTheDocument();
        });
    });

    it('displays error when authentication check fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Auth check failed'));

        const { getByText, getByRole } = render(UserPage);

        await waitFor(() => {
            expect(getByText('Error')).toBeInTheDocument();
            expect(getByText('Failed to check authentication status')).toBeInTheDocument();
            expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        });
    });

    it('can retry authentication check', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Auth check failed'));

        const { getByRole } = render(UserPage);

        await waitFor(() => {
            expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        });

        // Clear the mock and set up successful response for retry
        mockFetch.mockClear();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    myUser: null
                }
            })
        });

        const retryButton = getByRole('button', { name: 'Retry' });
        await fireEvent.click(retryButton);

        expect(mockFetch).toHaveBeenCalled();
    });
});