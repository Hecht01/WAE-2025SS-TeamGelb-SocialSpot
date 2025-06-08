<script lang="ts">
    import type { EventData } from '$lib/types';
    // lucide is a package for icons, which are customizable with color, size, stroke width etc.
    import {Heart, MessageCircle} from 'lucide-svelte';
    export let event: EventData;

    import {isOverlayOpen, eventPickedForDetailView} from "../../stores/OverlayStore"; // used for detail view overlay
</script>

<!-- role, tabindex, on:keydown added because we made a div clickable -->
<div class="event-box"
     on:click={() => {
                isOverlayOpen.set(true);
                eventPickedForDetailView.set(event);
     }}
     role="button"
     tabindex="0"
     on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          isOverlayOpen.set(false);
          eventPickedForDetailView.set(null);
        }
        }}
>
    <div class="event-image">
        <img src="{event.image}" alt="{event.title}" class="w-full h-40 object-cover" />
        <div class="event-image-overlay">
            <div class="event-image-overlay-item">
                <Heart class="w-5 h-5 text-white" />
                <span>{event.likes}</span>
            </div>
            <div class="event-image-overlay-item">
                <MessageCircle class="w-5 h-5 text-white" />
                <span>{event.comments}</span>
            </div>
        </div>
    </div>

    <div class="event-infos">
        <h2 class="event-header">
            <button class="hover:text-[#bf2b47]" on:click={() => {
                isOverlayOpen.set(true);
                eventPickedForDetailView.set(event);
            }} >{event.title}</button>
        </h2>
        <p class="event-p"><strong>Date:</strong> {event.startDate} - {event.endDate}; Time: {event.startTime}</p>
        <p class="event-p"><strong>Place:</strong> {event.place}</p>
        <p class="event-p truncate"><strong>Description:</strong> {event.description}</p>
        <button class="sosp-button-secondary">Join</button>
    </div>
</div>