<script lang="ts">
    import type { EventData } from '$lib/types';
    import {Heart, MessageCircle} from 'lucide-svelte'; // lucide is a package for icons, which are customizable with color, size, stroke width etc.
    import {isOverlayOpen, eventPickedForDetailView} from "../../stores/OverlayStore"; // used for detail view overlay
    import {createEventActions} from "../../stores/eventInteractions";
    import { eventUpdates} from "../../stores/EventStore";
    import {onMount} from "svelte";

    export let event: EventData;

    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`;

    const eventActions: any = createEventActions(event);

    $: isLiked = eventActions?.isLiked;
    $: isJoined = eventActions?.isJoined;
    $: localLikeCount = eventActions?.localLikeCount;
    $: isLoading = eventActions?.isLoading;

    onMount(() => {
        const unsubscribe = eventUpdates.subscribe(update => {
            if(update && update.eventId === event.id) {
                if (update.type === 'like') {
                    eventActions.isLiked.set(update.isLiked);
                    eventActions.localLikeCount.set(update.likeCount);
                } else if (update.type === 'join') {
                    eventActions.isJoined.set(update.isJoined);
                }
            }
        });
        return unsubscribe;
    })

    function openDetailView() {
        isOverlayOpen.set(true);
        eventPickedForDetailView.set(event);
    }

    // stop propagation for buttons that should not trigger the detail view when clicked on
    function handleButtonClick(e, action){
        e.stopPropagation();
        action();
    }
</script>

<!-- role, tabindex, on:keydown added because we made a div clickable -->
<div class="event-box"
     on:click={openDetailView}
     role="button"
     tabindex="0"
     on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            openDetailView();
        }
        }}
>
    <div class="event-image">
        <img src="{API_URL}/images/{event.thumbnail}" alt="{event.title}" class="w-full h-40 object-cover" />
        <div class="event-image-overlay">
            <div class="event-image-overlay-item">
                <button
                    on:click={(e) => handleButtonClick(e, eventActions.toggleLike)}
                    disabled={$isLoading}
                >
                    <Heart class="w-5 h-5 text-white {$isLiked ? 'fill-current' : ''}" />
                </button>
                <span>{$localLikeCount}</span>
            </div>
            <div class="event-image-overlay-item">
                <MessageCircle class="w-5 h-5 text-white" />
                <span>{event.commentCount}</span>
            </div>
        </div> 
    </div>

    <div class="event-infos">
        <h2 class="event-header">
            <button class="hover:text-[#bf2b47]" on:click={() => {openDetailView}} >{event.title}</button>
        </h2>
        <p class="event-p"><strong>Date:</strong> {event.date}; Time: {event.time?.substring(0,5)}</p>
        <p class="event-p"><strong>Place:</strong> {event.location}</p>
        <p class="event-p truncate"><strong>Description:</strong> {event.description}</p>
        <button
                class="sosp-button-secondary"
                on:click={(e) => handleButtonClick(e, eventActions.toggleJoin)}
                disabled={$isLoading}
        >
            {#if $isJoined}
                Leave
            {:else}
                Join
            {/if}
        </button>
    </div>
</div>