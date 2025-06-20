import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NavBar from '$lib/components/NavBar.svelte';

describe('NavBar.svelte', () => {
    it('renders without crashing', () => {
        const { container } = render(NavBar);
        expect(container).toBeInTheDocument();
    });

    it('renders the logo', () => {
        const { getByAltText } = render(NavBar);

        const logo = getByAltText('Social Spot Logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', '/logo_no_background.png');
    });

    it('renders all navigation links', () => {
        const { getByText } = render(NavBar);

        expect(getByText('Home')).toBeInTheDocument();
        expect(getByText('Map')).toBeInTheDocument();
        expect(getByText('Create New Event')).toBeInTheDocument();
        expect(getByText('My Profile')).toBeInTheDocument();
    });

    it('has correct href attributes for navigation links', () => {
        const { getByText } = render(NavBar);

        const homeLink = getByText('Home').closest('a');
        const mapLink = getByText('Map').closest('a');
        const createEventLink = getByText('Create New Event').closest('a');
        const profileLink = getByText('My Profile').closest('a');

        expect(homeLink).toHaveAttribute('href', '/');
        expect(mapLink).toHaveAttribute('href', '/map');
        expect(createEventLink).toHaveAttribute('href', '/CreatePost');
        expect(profileLink).toHaveAttribute('href', '/userPage');
    });

    it('applies correct CSS classes to navigation links', () => {
        const { getByText } = render(NavBar);

        const homeLink = getByText('Home');
        expect(homeLink).toHaveClass('sosp-navbar-button');
    });

    it('has sticky header with correct styling', () => {
        const { container } = render(NavBar);

        const header = container.querySelector('header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('sticky', 'top-0', 'left-0', 'z-30', 'w-full');
        expect(header).toHaveClass('flex', 'items-center');
        expect(header).toHaveClass('border-b-2', 'border-gray-200');
        expect(header).toHaveClass('bg-[#fcfcfc]');
        expect(header).toHaveClass('px-5', 'py-4');
        expect(header).toHaveClass('shadow-md');
        expect(header).toHaveClass('font-sans', 'text-lg');
    });

    it('has logo container with correct styling', () => {
        const { container } = render(NavBar);

        const logoContainer = container.querySelector('.px-12.font-bold');
        expect(logoContainer).toBeInTheDocument();

        const logo = logoContainer?.querySelector('img');
        expect(logo).toHaveClass('max-h-[45px]');
    });

    it('has navigation container with correct styling', () => {
        const { container } = render(NavBar);

        const nav = container.querySelector('nav');
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveClass('flex', 'gap-4');
    });

    it('renders all expected elements in correct structure', () => {
        const { container } = render(NavBar);

        const header = container.querySelector('header');
        const logoContainer = header?.querySelector('.px-12.font-bold');
        const nav = header?.querySelector('nav');
        const links = nav?.querySelectorAll('a');

        expect(header).toBeInTheDocument();
        expect(logoContainer).toBeInTheDocument();
        expect(nav).toBeInTheDocument();
        expect(links).toHaveLength(4);
    });
});