import { render, waitFor } from '@testing-library/svelte';
import Map from '$lib/components/Map.svelte';
import { describe, it, expect, test, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { tick } from 'svelte';
vi.mock('graphql-request');
import { GraphQLClient } from 'graphql-request';
import { get } from 'svelte/store';

const mockEventPickedForDetailView = {
  set: vi.fn(),
  subscribe: vi.fn()
};

const mockIsOverlayOpen = {
  set: vi.fn(),
  subscribe: vi.fn()
};

vi.mock('../../stores/OverlayStore', () => ({
  eventPickedForDetailView: mockEventPickedForDetailView,
  isOverlayOpen: mockIsOverlayOpen
}));

vi.mock('./EventDetailView.svelte', () => ({
  default: vi.fn()
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet.markercluster/dist/MarkerCluster.css', () => ({}));
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}));

//mock leaflet marker
const mockMarkers: any[] = [];
const mockMarkerClusterGroup = {
  addLayer: vi.fn((marker) => {
    mockMarkers.push(marker);
  }),
  clearLayers: vi.fn(() => {
    mockMarkers.length = 0;
  }),
  getLayers: vi.fn(() => mockMarkers)
};

const mockMap = {
  setView: vi.fn().mockReturnThis(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  _container: document.createElement('div')
};

const mockMarker = {
  on: vi.fn(),
  addTo: vi.fn(),
  getLatLng: vi.fn(() => ({ lat: 51.5, lng: 10.1 }))
};

const mockTileLayer = {
  addTo: vi.fn()
};

vi.mock('leaflet', () => ({
  map: vi.fn(() => mockMap),
  marker: vi.fn(() => {
    const newMarker = { ...mockMarker };
    return newMarker;
  }),
  tileLayer: vi.fn(() => mockTileLayer),
  markerClusterGroup: vi.fn(() => mockMarkerClusterGroup),
  Icon: {
    Default: {
      mergeOptions: vi.fn()
    }
  }
}));

vi.mock('leaflet.markercluster', () => ({
  default: vi.fn(() => mockMarkerClusterGroup),
  //markerClusterGroup: vi.fn(() => mockMarkerClusterGroup)
}));



// mock for graphql

const mockEventData = {
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
      thumbnail: 'image.jpg',
      likeCount: 5,
      commentCount: 2,
      address: 'Test Address 1'
    },
    {
      id: '2',
      title: 'Another Event',
      latitude: 52.5,
      longitude: 13.4,
      date: '2025-07-02',
      time: '18:00',
      location: 'München',
      description: 'Another test desc',
      thumbnail: 'image2.jpg',
      likeCount: 10,
      commentCount: 5,
      address: 'Test Address 2'
    },
    {
      id: '3',
      title: 'Berlin Special',
      latitude: 52.52,
      longitude: 13.405,
      date: '2025-07-01',
      time: '20:00',
      location: 'Berlin',
      description: 'Berlin event',
      thumbnail: 'image3.jpg',
      likeCount: 3,
      commentCount: 1,
      address: 'Berlin Address'
    }
  ]
};

vi.mock('graphql-request', () => {
  return {
    request: vi.fn(() => Promise.resolve(mockEventData)),
      
     gql: vi.fn((strings: TemplateStringsArray) => strings.join(''))
  };
});

vi.mock('$env/static/public', () => ({
  PUBLIC_API_URL: 'http://localhost:4000'
}));

describe('Map.svelte', () => {
  beforeEach(() => {
  vi.clearAllMocks();
    mockMarkers.length = 0;
    
     mockEventPickedForDetailView.set.mockClear();
    mockIsOverlayOpen.set.mockClear();
    
    
  });

  it('renders the map container', () => {
    const { container } = render(Map, { props: { filters: { city: '', date: '', category: '', title: '' } } });

    const mapElement = container.querySelector('#map');
    expect(mapElement).toBeInTheDocument();
  });

   it('initializes Leaflet map with correct parameters', async () => {
    render(Map, { 
      props: { filters: { city: '', date: '', category: '', title: '' } } 
    });
    
    await tick();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockMap.setView).toHaveBeenCalledWith([51.1, 10.5], 6);
    expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
    expect(mockMap.addLayer).toHaveBeenCalledWith(mockMarkerClusterGroup);
  });

  it('adds marker to the map after data fetch', async () => {
    const { request } = await import('graphql-request');

    render(Map, {
      props: { filters: { city: '', date: '', category: '', title: '' } }
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
      expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalledTimes(6); //three mock events
    },
  { timeout: 3000 });
  });

  it('filters events by title', async () => {
  const { request } = await import('graphql-request');
    
    render(Map, { 
      props: { filters: { title: 'Test Event', city: '', date: '', category: '' } } 
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
      expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalledTimes(2); //Testevent
    },
  { timeout: 3000 });
  });

  it('filters events by city', async () => {
    const { request } = await import('graphql-request');
    
    render(Map, { 
      props: { filters: { city: 'Berlin', date: '', category: '', title: '' } } 
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
      expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalledTimes(4); //Testevent and Testevent2
    },
  { timeout: 3000 });
  });

  it('filters events by date', async () => {
    const { request } = await import('graphql-request');
    
    render(Map, { 
      props: { filters: { date: '2025-07-01', city: '', category: '', title: '' } } 
    });

    await waitFor(() => {
      expect(request).toHaveBeenCalled();
      expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalledTimes(4); //Events from 2025-07-01
    },
  { timeout: 3000 });
  });
});