<script>
    import EventFeed from '$lib/components/EventFeed.svelte';
    // dummy event list - only Pride, Ren-Fair and Animal Shelter
    let events = [
        {
            image: '/examplePride.jpg',
            title: 'Pride March 2025',
            place: 'Amberg - City Center',
            description: 'Join the celebration at this year’s Pride March! Dance, cheer, and show your colors as we come together for love, equality, and fun. All are welcome—let’s make this a day to remember!',
            startDate: '02.08.2025',
            endDate: '02.08.2025',
            startTime: '12:00',
            likes: 13,
            comments: 7,
        },
        {
            image: '/exampleRenFair.jpg',
            title: 'Renaissance Fair',
            place: 'Amberg - Old Castle',
            description: 'Join us for this year’s Pride March in Amberg! We’ll kick off at city center, march through the vibrant streets, and finish with a celebration at the park. Bring your friends, your flags, and your best energy for a colorful journey of love and pride!',
            startDate: '31.08.2025',
            endDate: '02.09.2025',
            startTime: '11:00',
            likes: 42,
            comments: 5,
        },
        {
            image: '/exampleShelter.jpg',
            title: 'Animal Shelter Festival',
            place: 'Amberg - Animal Shelter Purrfection',
            description: 'You can meet all the cute animals, and if that’s not enough, there’s also delicious food and awesome entertainment for everyone. Come join the fun and support our furry friends!',
            startDate: '03.09.2025',
            endDate: '03.09.2025',
            startTime: '09:00',
            likes: 56,
            comments: 21,
        },
    ]

    // dummy user
    export let user = {
        name: "Your username here",
        location: "Amberg",
        avatarUrl: "/user.png", // Beispielbild
    };
</script>

<div class="max-w-6xl mx-auto p-4 bg-[#fcfcfc] rounded-2xl shadow-md flex flex-col space-y-6">
    <!-- User Profile -->
    <div class="flex items-center justify-between border-b border-[#bf2b47] pb-4">
        <div>
            <h1 class="text-2xl font-bold text-[#541a46]">{user.name}</h1>
            <p class="text-sm text-[#892247]">{user.location}</p>
        </div>
        <img
        src={user.avatarUrl}
        alt="User Avatar"
        class="w-16 h-16 rounded-full object-cover border-2 border-[#892246]"/>
    </div>

    <!-- User Events -->
    <div class="grid grid-cols-1 gap-2 p-4 max-w-6xl h-[28rem] mx-auto rounded-2xl border-2 border-[#bf2b47] shadow-md bg-[#fcfcfc]">
        <h2 class="text-2xl font-bold text-[#541a46] mb-1">Your Created Events</h2>
        <div class="flex-grow overflow-y-auto">
            <EventFeed {events}/>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-2 p-4 max-w-6xl h-[28rem] mx-auto rounded-2xl border-2 border-[#bf2b47] shadow-md bg-[#fcfcfc]">
        <h2 class="text-2xl font-bold text-[#541a46] mb-1">Joined Events</h2>
        <div class="flex-grow overflow-y-auto">
            <EventFeed {events}/>
        </div>
    </div>
</div>


