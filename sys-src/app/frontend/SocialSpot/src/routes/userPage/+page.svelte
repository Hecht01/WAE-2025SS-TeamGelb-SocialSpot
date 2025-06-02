<script>
    import EventFeed from '$lib/components/EventFeed.svelte';
    // dummy event list - only Pride, Ren-Fair and Animal Shelter
    let events = [
        {
            id: 3,
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
            id: 4,
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
            id: 5,
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

    // dummy user (starts out as null so not logged in)
    let user = null;

    // !! means isLoggedIn is true if user is defined, and false if user is null
    $: isLoggedIn = !!user;

    // dummy log-in CHANGE THIS FOR OAUTH
    function handleLogin() {
        user = {
            name: "AmazingUsername",
            location: "Amberg",
            mail: "user@example.com",
            avatarUrl: "/dummyUser.jpg",
        };
    }
</script>


{#if isLoggedIn}
    <!-- if user logged in, show profile page -->
    <div class="max-w-6xl mx-auto p-4 bg-[#fcfcfc] rounded-2xl shadow-md flex flex-col space-y-6">
        <!-- user info -->
        <div class="flex items-center justify-between border-b border-[#bf2b47] pb-4">
            <div >
                <h1 class="text-2xl font-bold text-[#541a46]">{user.name}</h1>
                <p class="text-sm text-[#892247]">My location: {user.location}</p>
                <p class="text-sm text-[#892247]">My email: {user.mail}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
                <img
                src={user.avatarUrl}
                alt="User Avatar"
                class="w-16 h-16 rounded-full object-cover border-2 border-[#892246]"/>
                <!-- Log-Out means putting user as null again -->
                <button on:click={() => (user = null)} class="sosp-button">
                    Log Out
                </button>
            </div>
        </div>

        <!-- user events (created and joined) -->
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

{:else}
    <!-- if user not logged in, ask for log-in -->
    <div class="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div class="w-full max-w-[34rem] h-[22rem] rounded-2xl overflow-hidden shadow-md bg-[#fcfcfc] flex flex-col">
            <div class="p-4 flex flex-col gap-4 text-[#1f1246] h-full items-center justify-center text-center">
                <h2 class="text-lg font-bold text-[#541a46]">
                    Please Log In to continue to your profile
                </h2>
                <button on:click={handleLogin} class="google-button">
                    <img src="/GoogleLogo.jpg" alt="Google Logo" class="google-logo" />
                    Mit Google registrieren
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .google-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #fff;
        color: #5f6368;
        border: 1px solid #dadce0;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        transition: background-color 0.2s, box-shadow 0.2s;
    }

    .google-button:hover {
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .google-logo {
        width: 20px;
        height: 20px;
    }
</style>

