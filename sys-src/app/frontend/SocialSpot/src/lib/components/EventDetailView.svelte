<script lang="ts">
    import {eventPickedForDetailView, isOverlayOpen} from "../../stores/OverlayStore";
    import {Heart, MessageCircle} from "lucide-svelte";
</script>

{#if $eventPickedForDetailView}
    <!-- bg-[#1f1246]/90 controls the opacity (/90 = 90%) for just the background -->
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
        <div class="w-full max-w-6xl h-[34rem] rounded-2xl overflow-hidden shadow-md bg-[#fcfcfc] flex flex-col"
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
            <!-- Event Image + Likes/Comments -->
            <div class="relative">
                <button
                        class="absolute top-0 right-2 z-500 text-4xl text-bold text-[#541a46] hover:text-[#bf2b47] transition-transform"
                        on:click={() => {
                        isOverlayOpen.set(false);
                        eventPickedForDetailView.set(null);
                        }}>&times</button>
                <img src="{$eventPickedForDetailView.image}" alt="{$eventPickedForDetailView.title}" class="w-full h-70 object-cover" />
                <div class="absolute bottom-1 right-2 flex gap-6 text-sm text-[#fcfcfc] bg-[#bf2b47]/80 px-3 py-1 rounded-xl">
                    <div class="flex items-center gap-1">
                        <Heart class="w-5 h-5 text-white" />
                        <span>{$eventPickedForDetailView.likes}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <MessageCircle class="w-5 h-5 text-white" />
                        <span>{$eventPickedForDetailView.comments}</span>
                    </div>
                </div>
            </div>

            <!-- Event Infos -->
            <div class="p-4 flex flex-col gap-2 text-[#1f1246] h-full">
                <h2 class="text-lg font-bold text-[#541a46]">{$eventPickedForDetailView.title}</h2>
                <p class="text-sm text-[#892246]"><strong>Date:</strong> {$eventPickedForDetailView.startDate} - {$eventPickedForDetailView.endDate}; Time: {$eventPickedForDetailView.startTime}</p>
                <p class="text-sm text-[#892246]"><strong>Place:</strong> {$eventPickedForDetailView.place}</p>
                <p class="text-sm text-[#892246]"><strong>Description:</strong> {$eventPickedForDetailView.description}</p>
                <button class="mt-auto self-start bg-[#bf2b47] text-[#fcfcfc] px-4 py-1 rounded hover:bg-[#892246] transition">
                    Join
                </button>
            </div>
        </div>
    </div>

<!-- should technically never happen but is here just in case for error handling -->
{:else}
    <div class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center bg-[#1f1246] opacity-90 text-white">
        <p>No event selected.</p>
    </div>
{/if}
