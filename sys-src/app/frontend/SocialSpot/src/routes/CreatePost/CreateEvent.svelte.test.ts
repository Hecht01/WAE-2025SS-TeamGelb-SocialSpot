import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import CreatePost from './+page.svelte';

describe('CreatePost Page', () => {
    it('renders the page correctly', () => {
        render(CreatePost);

        const titleInput = screen.getByPlaceholderText('Titel of the event');
        expect(titleInput).toBeInTheDocument();

        const locationInput = screen.getByPlaceholderText('Location where the event takes place');
        expect(locationInput).toBeInTheDocument();

        const addressInput = screen.getByPlaceholderText('Enter street and house number');
        expect(addressInput).toBeInTheDocument();

        const descriptionInput = screen.getByPlaceholderText('Event description');
        expect(descriptionInput).toBeInTheDocument();

        const dateInput = screen.getByPlaceholderText('Start date');
        expect(dateInput).toBeInTheDocument();

        const timeInput = screen.getByPlaceholderText('Start time');
        expect(timeInput).toBeInTheDocument();

        const submitButton = screen.getByText('Create Event');
        expect(submitButton).toBeInTheDocument();
    });

    it('validates empty fields on submit', async () => {
        render(CreatePost);

        const submitButton = screen.getByText('Create Event');
        await fireEvent.click(submitButton);

        // Überprüfe, ob das Formular nicht abgesendet wird
        const titleInput = screen.getByPlaceholderText('Titel of the event');
        expect(titleInput.checkValidity()).toBe(false);

        const descriptionInput = screen.getByPlaceholderText('Event description');
        expect(descriptionInput.checkValidity()).toBe(false);

        const dateInput = screen.getByPlaceholderText('Start date');
        expect(dateInput.checkValidity()).toBe(false);

        const timeInput = screen.getByPlaceholderText('Start time');
        expect(timeInput.checkValidity()).toBe(false);
    });

    it('allows input in the title field', async () => {
        render(CreatePost);

        const titleInput = screen.getByPlaceholderText('Titel of the event');
        await fireEvent.input(titleInput, { target: { value: 'Test Event' } });

        expect(titleInput.value).toBe('Test Event');
    });

    it('submits the form successfully when all fields are filled', async () => {
        render(CreatePost);

        const titleInput = screen.getByPlaceholderText('Titel of the event');
        const locationInput = screen.getByPlaceholderText('Location where the event takes place');
        const addressInput = screen.getByPlaceholderText('Enter street and house number');
        const descriptionInput = screen.getByPlaceholderText('Event description');
        const dateInput = screen.getByPlaceholderText('Start date');
        const timeInput = screen.getByPlaceholderText('Start time');
        const submitButton = screen.getByText('Create Event');

        await fireEvent.input(titleInput, { target: { value: 'Test Event' } });
        await fireEvent.input(locationInput, { target: { value: 'Berlin' } });
        await fireEvent.input(addressInput, { target: { value: 'Street 123' } });
        await fireEvent.input(descriptionInput, { target: { value: 'This is a test event.' } });
        await fireEvent.input(dateInput, { target: { value: '2025-06-19' } });
        await fireEvent.input(timeInput, { target: { value: '12:00' } });

        await fireEvent.click(submitButton);

        // Überprüfe, ob das Formular erfolgreich abgesendet wird
        const successMessage = screen.getByText('Event created successfully!');
        expect(successMessage).toBeInTheDocument();
    });
});