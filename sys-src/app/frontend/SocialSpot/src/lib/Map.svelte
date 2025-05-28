<script lang="ts">
  import { onMount } from 'svelte';

  let mapContainer: HTMLDivElement;

  onMount(async () => {
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    const map = L.map(mapContainer).setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.marker([51.505, -0.09])
      .addTo(map)
      .bindPopup('Du bist hier!')
      .openPopup();
  });

</script>

<style>
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    gap: 1rem;
  }

  .map-container {
    width: 90%;
    max-width: 1000px;
    height: 600px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

</style>

<div class="page">
  <div class="map-container" bind:this={mapContainer}></div>
</div>