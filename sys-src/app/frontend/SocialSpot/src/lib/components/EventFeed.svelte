<script>
    import EventBox from './EventBox.svelte';

    export let events;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-6xl mx-auto">
    {#each events as event}
        <EventBox {...event}/>
    {/each}
</div>
