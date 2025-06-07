<script lang="ts">
    import type { EventData } from '$lib/types';
    // lucide is a package for icons, which are customizable with color, size, stroke width etc.
    import {Heart, MessageCircle} from 'lucide-svelte';
    export let event: EventData;

    // used for detail view overlay
    import {isOverlayOpen, eventPickedForDetailView} from "../../stores/OverlayStore";
</script>

<div class="w-full max-w-[34rem] h-[22rem] rounded-2xl overflow-hidden shadow-md bg-[#fcfcfc] flex flex-col">
    <!-- Event Image + Likes/Comments -->
    <div class="relative">
        <img src="{event.image}" alt="{event.title}" class="w-full h-40 object-cover" />
        <div class="absolute bottom-1 right-2 flex gap-6 text-sm text-[#fcfcfc] bg-[#bf2b47]/80 px-3 py-1 rounded-xl">
            <div class="flex items-center gap-1">
                <Heart class="w-5 h-5 text-white" />
                <span>{event.likes}</span>
            </div>
            <div class="flex items-center gap-1">
                <MessageCircle class="w-5 h-5 text-white" />
                <span>{event.comments}</span>
            </div>
        </div>
    </div>

    <!-- Event Infos -->
    <div class="p-4 flex flex-col gap-2 text-[#1f1246] h-full">
        <h2 class="text-lg font-bold text-[#541a46]">
            <button class="hover:text-[#bf2b47]" on:click={() => {
                isOverlayOpen.set(true);
                eventPickedForDetailView.set(event);
            }} >{event.title}</button>
        </h2>
        <p class="text-sm text-[#892246]"><strong>Date:</strong> {event.startDate} - {event.endDate}; Time: {event.startTime}</p>
        <p class="text-sm text-[#892246]"><strong>Place:</strong> {event.place}</p>
        <p class="text-sm text-[#892246] truncate"><strong>Description:</strong> {event.description}</p>
        <button class="mt-auto self-start bg-[#bf2b47] text-[#fcfcfc] px-4 py-1 rounded hover:bg-[#892246] transition">
  Join
</button>
    </div>
</div>