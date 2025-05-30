<script lang="ts">
    import EventBox from './EventBox.svelte';
    import type {EventData} from "$lib/types";

    export let events: EventData[];
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-6xl mx-auto">
    {#each events as event}
        <EventBox {event}/>
    {/each}
</div>
