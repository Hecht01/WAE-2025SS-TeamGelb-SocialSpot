<script>
  import Map from '$lib/Map.svelte';
  import { goto } from '$app/navigation';
  import "$lib/style.css";
</script>

<img src="logo.png" alt="Social Spot Logo" style="max-width: 400px; margin: 2rem auto; display: block;" />
<Map />

<button class="sosp-button" on:click={() => goto('/')}>Zurück</button>


