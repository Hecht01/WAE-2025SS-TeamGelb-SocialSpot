<script lang="ts">
    import {eventPickedForDetailView, isOverlayOpen} from "../../stores/OverlayStore";
    import {Heart, MessageCircle} from "lucide-svelte";

    const IMAGE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/images/`;

</script>

{#if $eventPickedForDetailView}
    <!-- bg-[#1f1246]/60 controls the opacity (/60 = 60%) for just the background -->
    <!-- role, tabindex and on:keydown are included because we use on:click on a div -->
    <div
        class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center bg-[#1f1246]/60"
         on:click={() => {
            isOverlayOpen.set(false);
            eventPickedForDetailView.set(null);
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
        <div class="event-box-large"
             on:click|stopPropagation
             role="button"
             tabindex="0"
             on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              isOverlayOpen.set(false);
              eventPickedForDetailView.set(null);
            }
            }}
        >

            <div class="relative">
                <!-- x button in top right corner -->
                <button
                        class="absolute top-0 right-2 z-500 text-4xl text-bold text-[#541a46] hover:text-[#bf2b47] transition-transform"
                        on:click={() => {
                        isOverlayOpen.set(false);
                        eventPickedForDetailView.set(null);
                        }}>&times</button>
                <img src={`${IMAGE_URL}${$eventPickedForDetailView.thumbnail}`} alt="{$eventPickedForDetailView.title}" class="event-image-large" />
                <!--
                <div class="event-image-overlay">
                    <div class="event-image-overlay-item">
                        <Heart class="w-5 h-5 text-white" />
                        <span>{$eventPickedForDetailView.likes}</span>
                    </div>
                    <div class="event-image-overlay-item">
                        <MessageCircle class="w-5 h-5 text-white" />
                        <span>{$eventPickedForDetailView.comments}</span>
                    </div>
                </div>
                -->
            </div>

            <div class="event-infos">
                <h2 class="event-header">{$eventPickedForDetailView.title}</h2>
                <p class="event-p"><strong>Date:</strong> {new Date(parseInt($eventPickedForDetailView.date) ).toLocaleDateString()}; Time: {$eventPickedForDetailView.time.substring(0,5)}</p>
                <p class="event-p"><strong>Place:</strong> {$eventPickedForDetailView.address}</p>
                <p class="event-p"><strong>Description:</strong> {$eventPickedForDetailView.description}</p>
                <button class="sosp-button-secondary">Join</button>
            </div>
        </div>
    </div>

<!-- should technically never happen but is here just in case for error handling -->
{:else}
    <div class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center bg-[#1f1246] opacity-90 text-white">
        <p>No event selected.</p>
    </div>
{/if}
