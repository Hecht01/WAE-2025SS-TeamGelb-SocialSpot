<script lang="ts">
  import { onMount } from 'svelte';
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import 'leaflet.markercluster';
  import 'leaflet.markercluster/dist/MarkerCluster.css';
  import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

  import { request, gql } from 'graphql-request';

  let mapContainer: HTMLDivElement;
  const endpoint = 'http://localhost:4000/graphql';

  //GraphQL query
  const query = gql`
    query {
      eventList {
        id
        title
        latitude
        longitude
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
      const data = await request(endpoint, query);

      data.eventList.forEach((event: any) => {
        if (event.latitude && event.longitude) {
          const marker = L.marker([event.latitude, event.longitude])
            .bindPopup(`<strong>${event.title}</strong>`);
          markerClusterGroup.addLayer(marker);
        }
      });

      map.addLayer(markerClusterGroup);

    } catch (err) {
      console.error('Error creating event in map:', err);
    }
  });
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
  }
</style>

<div class="map-wrapper">
  <div bind:this={mapContainer} id="map"></div>
</div>