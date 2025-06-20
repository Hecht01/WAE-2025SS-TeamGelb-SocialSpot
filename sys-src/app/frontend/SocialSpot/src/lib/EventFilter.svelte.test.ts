import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import EventFilter from '$lib/components/EventFilter.svelte';
import { vi } from 'vitest';

describe('EventFilter – basic test', () => {
  it('renders all input fields', () => {
    const { getByPlaceholderText, getByText } = render(EventFilter);

    expect(getByPlaceholderText('Enter city location')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter event name')).toBeInTheDocument();
    expect(getByText('Date:')).toBeInTheDocument();
    expect(getByText('Apply')).toBeInTheDocument();
  });

  it('lets user type into event name field', async () => {
    const { getByPlaceholderText } = render(EventFilter);

    const input = getByPlaceholderText('Enter event name') as HTMLInputElement;

    await fireEvent.input(input, { target: { value: 'Test Event' } });

    expect(input.value).toBe('Test Event');
  });

  it('dispatches correct values when Apply is clicked', async () => {
  const { getByText, getByLabelText, container } = render(EventFilter);

  const cityInput = getByLabelText(/City/i);
  const titleInput = getByLabelText(/Event name/i);
  const dateInput = getByLabelText(/Date/i);
  const applyButton = getByText(/Apply/i);

  await fireEvent.input(cityInput, { target: { value: 'Berlin' } });
  await fireEvent.input(titleInput, { target: { value: 'Party' } });
  await fireEvent.input(dateInput, { target: { value: '2025-07-01' } });

  const dispatchMock = vi.fn();
  container.addEventListener('filter', (e: any) => {
    dispatchMock(e.detail);
  });

  await fireEvent.click(applyButton);

  expect(dispatchMock).toHaveBeenCalledWith({
    title: 'Festival',
    date: '2025-07-01',
    category: '',
    city: 'Berlin'
  });
});
});