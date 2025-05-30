<script lang="ts">
    import NavBar from "$lib/components/NavBar.svelte";
    import "../app.css";
    import EventDetailView from "$lib/components/EventDetailView.svelte";
    import {isOverlayOpen} from "../stores/OverlayStore";
</script>

<NavBar></NavBar>

{#if $isOverlayOpen}
    <div class="fixed inset-0 z-50">
        <EventDetailView />
    </div>
{/if}

<slot></slot>