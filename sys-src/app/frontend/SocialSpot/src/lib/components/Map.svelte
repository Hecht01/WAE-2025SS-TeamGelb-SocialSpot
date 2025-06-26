<script lang="ts">
  import { onMount } from 'svelte';
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
  import MarkerClusterGroup from 'leaflet.markercluster';
  import { eventPickedForDetailView, isOverlayOpen } from '../../stores/OverlayStore';

  import { request, gql } from 'graphql-request';
	import EventDetailView from './EventDetailView.svelte';

  import markerIcon from 'leaflet/dist/images/marker-icon.png';
  import markerShadow from 'leaflet/dist/images/marker-shadow.png';

  L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow
  });
  
  export let filters: { category: string; date: string; city: string; title: string; };

  let mapContainer: HTMLDivElement;
  let map: L.Map;
  let markerClusterGroup: L.MarkerClusterGroup;
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

   let previousFilters: typeof filters = { category: '', date: '', city: '', title: '' };

  //GraphQL query
  const query = gql`
    query {
      eventList {
        id
      title
      latitude
      longitude
      description
      date
      time
      location
      address
      likeCount
      commentCount
      thumbnail
      }
    }
  `;

  //Create map points and map cluster
  onMount(async () => {
    map = L.map(mapContainer).setView([51.1, 10.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);

    await fetchAndDisplayEvents();
  });

$: if (
    markerClusterGroup &&
    JSON.stringify(filters) !== JSON.stringify(previousFilters)
  ) {
    previousFilters = { ...filters };
    fetchAndDisplayEvents();
  }

  async function fetchAndDisplayEvents() {
    markerClusterGroup.clearLayers();

    try {
      const data = await request(API_URL, query);
      let filtered = data.eventList;

      console.log("Alle Events aus Backend:", data.eventList);
      console.log("Aktive Filter:", filters);

      if (filters.city) {
        filtered = filtered.filter(event =>
          event.location?.toLowerCase().includes(filters.city.toLowerCase())
        );
      }

      if (filters.category) {
        filtered = filtered.filter(event =>
          event.type?.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.date) {
        filtered = filtered.filter(event => event.date === filters.date);
      }

      if (filters.title) {
        filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(filters.title.toLowerCase())
        );
      }

      markerClusterGroup.clearLayers();
      filtered.forEach((event: any) => {
        if (event.latitude && event.longitude) {
          const marker = L.marker([event.latitude, event.longitude]);
          marker.on('click', () => {
            eventPickedForDetailView.set(event);
            isOverlayOpen.set(true);
          });
          markerClusterGroup.addLayer(marker);
        }
      });

    } catch (err) {
      console.error('Error creating event in map:', err);
    }
  }
</script>

 <!--map style-->
<style>
  .map-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 2rem; 
    padding-bottom: 2rem;
  }

  #map {
    height: 780px;
    width: 80%;
    max-width: 1920px;
    border-radius: 12px;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }

  .event-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: rgba(0, 0, 0, 0.4); 
}

.event-detail-overlay > * {
  pointer-events: auto;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
}
</style>

<div class="map-wrapper">
  <div bind:this={mapContainer} id="map"></div>
</div>

