import { render, waitFor } from '@testing-library/svelte';
import Map from '$lib/components/Map.svelte';
import { describe, it, expect, test, beforeEach } from 'vitest';
import { vi } from 'vitest';
vi.mock('graphql-request');
import { GraphQLClient } from 'graphql-request';

// mock for graphql
vi.mock('graphql-request', () => {
  return {
    request: vi.fn(() => Promise.resolve({
      eventList: [
        {
          id: '1',
          title: 'Test Event',
          latitude: 51.5,
          longitude: 10.1,
          date: '2025-07-01',
          time: '14:00',
          location: 'Berlin',
          description: 'Test desc',
          thumbnail: 'image.jpg'
        }
      ]
    })),
    gql: (strings: TemplateStringsArray) => strings.join('') 
  };
});

describe('Map.svelte', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the map container', () => {
    const { container } = render(Map, { props: { filters: { city: '', date: '', category: '', title: '' } } });
    expect(container.querySelector('#map')).toBeInTheDocument();
  });

  it('adds marker to the map after data fetch', async () => {
    render(Map, { props: { filters: { city: '', date: '', category: '', title: '' } } });

    await waitFor(() => {
      const markerElements = document.querySelectorAll('.leaflet-marker-icon');
      expect(markerElements.length).toBeGreaterThan(0);
    });
  });

  it('filters events by title', async () => {
  render(Map, { props: { filters: { title: 'Test', city: '', date: '', category: '' } } });

  await waitFor(() => {
    const markerElements = document.querySelectorAll('.leaflet-marker-icon');
    expect(markerElements.length).toBe(1); //one mock event
  });
});
});