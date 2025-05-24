<script>
    // lucide is a package for icons, which are customizable with color, size, stroke width etc.
    import {Heart, MessageCircle} from 'lucide-svelte';
    export let image;
    export let title;
    export let place;
    export let description;
    export let startDate;
    export let endDate;
    export let startTime;
    export let likes=0;
    export let comments=0;
</script>

<div class="w-full max-w-[34rem] h-[22rem] rounded-2xl overflow-hidden shadow-md bg-[#fcfcfc] flex flex-col">
    <div class="relative">
        <img src="{image}" alt="{title}" class="w-full h-40 object-cover"/>
    </div>
    <div class="p-4 flex flex-col gap-2 text-[#1f1246] h-[22rem]">
        <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-[#541a46]">{title}</h2>
            <div class="flex gap-6 text-sm text-[#892246]">
                <div class="flex items-center gap-1">
                    <Heart class="w-5 h-5 text-[#bf2b47] fill-[bf2b47]"/>
                    <span>{likes}</span>
                </div>
                <div class="flex items-center gap-1">
                    <MessageCircle class="w-5 h-5 text-[#bf2b47] fill-[bf2b47]"/>
                    <span>{comments}</span>
                </div>
            </div>
        </div>

        <p class="text-sm text-[#892246]">{place}: {startDate} - {endDate}, {startTime}</p>
        <!-- line-clamp-2 cuts off the description after 2 rows and adds ... at the end -->
        <p class="text-sm line-clamp-2">{description}</p>
        <button class="mt-auto self-start bg-[#bf2b47] text-[#fcfcfc] px-4 py-1 rounded hover:bg-[#892246] transition">Join</button>
    </div>
</div>