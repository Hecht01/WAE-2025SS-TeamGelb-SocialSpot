import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import EventFilter from '$lib/components/EventFilter.svelte';
import { vi } from 'vitest';

vi.mock('graphql-request', () => ({
  request: vi.fn(),
  gql: vi.fn((query) => query)
}));

describe('EventFilter basic test', () => {
    beforeEach(() => {
    vi.clearAllMocks();
  });

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
});