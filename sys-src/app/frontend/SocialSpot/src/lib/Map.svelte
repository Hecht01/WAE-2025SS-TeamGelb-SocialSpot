<script lang="ts">
  import { onMount } from 'svelte';

  let mapContainer: HTMLDivElement;

  onMount(async () => {
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    const map = L.map(mapContainer).setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker([51.505, -0.09])
      .addTo(map)
      .bindPopup('Du bist hier!')
      .openPopup();
  });
</script>

<style>
  #map {
    height: 400px;
    width: 100%;
    border-radius: 12px;
  }
</style>

<div bind:this={mapContainer} id="map"></div>