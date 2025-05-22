<script>
  import Map from '$lib/Map.svelte';
  import { goto } from '$app/navigation';
</script>

<style>
    @import "src\lib\style.css"
</style>


<h1 class="sosp-header">SocialSpot - Kartenansicht</h1>
<Map />

<button class="sosp-button" on:click={() => goto('/')}>Zurück</button>


