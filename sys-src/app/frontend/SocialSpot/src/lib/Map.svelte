<script lang="ts">
  import { onMount } from 'svelte';
  import { request, gql } from 'graphql-request';

  let mapContainer: HTMLDivElement;

  const endpoint = 'http://localhost:4000/graphql';

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

  onMount(async () => {
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    const map = L.map(mapContainer).setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // GraphQL-Daten abfragen
    try {
      const data = await request(endpoint, query);

      data.eventList.forEach((event: any) => {
        if (event.latitude && event.longitude) {
          L.marker([event.latitude, event.longitude])
            .addTo(map)
            .bindPopup(`<strong>${event.title}</strong>`)
            .openPopup();
        }
      });

    } catch (err) {
      console.error('Fehler beim Abrufen der Events:', err);
    }
  });
</script>

<style>
  #map {
    height: 800px;
    width: 80%;
    border-radius: 12px;
  }
</style>

<div bind:this={mapContainer} id="map"></div>