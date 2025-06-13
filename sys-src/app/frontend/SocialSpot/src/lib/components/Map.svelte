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

  let mapContainer: HTMLDivElement;
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

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
        thumbnail
      }
    }
  `;

  //Create map points and map cluster
  onMount(async () => {
    const map = L.map(mapContainer).setView([51.1, 10.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const markerClusterGroup = L.markerClusterGroup();

    try {
      const data = await request(API_URL, query);

      data.eventList.forEach((event: any) => {
        if (event.latitude && event.longitude) {
          const marker = L.marker([event.latitude, event.longitude]);

          marker.on('click', () => {
          console.log('event clicked:', event);
          eventPickedForDetailView.set(event);
          isOverlayOpen.set(true);
          });

          markerClusterGroup.addLayer(marker);
        }
      });
        map.addLayer(markerClusterGroup);
    }
    catch (err) {
      console.error('Error creating event in map:', err);
    }
  });

  function closeDetailView() {
    selectedEvent = null;
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

