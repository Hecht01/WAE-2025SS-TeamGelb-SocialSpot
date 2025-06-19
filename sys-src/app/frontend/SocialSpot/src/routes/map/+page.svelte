<script>
  import Map from '$lib/components/Map.svelte';
  import EventFilter from '$lib/components/EventFilter.svelte';
  import { goto } from '$app/navigation';
  import "$lib/style.css";

  let filters = {
    title: '',
    category: '',
    date: '',
    city: ''
  };

  function updateFilters(event) {
    // Neue Referenz erzeugen, damit Svelte reagiert:
    filters = { ...event.detail };
  }
</script>


<div class="page-layout">
  <div class="map-column">
    <Map {filters} />
  </div>
  <div class="filter-column">
    <EventFilter on:filter={updateFilters} />
  </div>
</div>

<style>
  .page-layout {
    display: flex;
    padding: 2rem;
    gap: 2rem;
    align-items: flex-start;
  }

   .map-column {
    flex: 3;
  }

  .filter-column {
    flex: 1;
    min-width: 250px;
    max-width: 400px;
  }
</style>


