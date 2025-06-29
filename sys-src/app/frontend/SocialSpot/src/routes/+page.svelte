<script lang="ts">
    import EventFeed from '$lib/components/EventFeed.svelte';
    import { onMount } from 'svelte';
    import { globalEvents, eventStoreActions } from "../stores/EventStore.js";

    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

    // dummy event list - all events
    /*
    let events = [
        {
            id: 1,
            thumbnail: '/exampleOpenMicNight.jpg',
            title: 'Open Mic Night',
            place: 'Amberg - Main Street 123',
            description: 'Join us for an evening of music, poetry, comedy, and more at our open mic night. Whether you're performing or cheering from the crowd, it's a fun and welcoming space for all creatives!',
            startDate: '18.05.2025',
            endDate: '18.05.2025',
            startTime: '19:00',
            likes: 28,
            comments: 7,
        },
        {
            id: 2,
            thumbnail: '/exampleDult.jpg',
            title: 'Amberger Dult',
            place: 'Amberg - Other Street 45',
            description: 'Come check out this year’s Amberger Dult! Enjoy sweet cotton candy, thrilling rides, tasty food, and loads of fun attractions for everyone. Don’t miss out on the biggest celebration of the year!',
            startDate: '20.06.2025',
            endDate: '22.06.2025',
            startTime: '10:00',
            likes: 33,
            comments: 10,
        },
        {
            id: 3,
            thumbnail: '/examplePride.jpg',
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
            id:4,
            thumbnail: '/exampleRenFair.jpg',
            title: 'Renaissance Fair',
            place: 'Amberg - Old Castle',
            description: 'Step into Ye Olde Ren Faire, where dragon-slaying contests, turkey leg duels, and lute-powered dance battles await! Beware the pickpocketing goblins and overly dramatic bards.',
            startDate: '31.08.2025',
            endDate: '02.09.2025',
            startTime: '11:00',
            likes: 42,
            comments: 5,
        },
        {
            id: 5,
            thumbnail: '/exampleShelter.jpg',
            title: 'Animal Shelter Festival',
            place: 'Amberg - Animal Shelter Purrfection',
            description: 'You can meet all the cute animals, and if that’s not enough, there’s also delicious food and awesome entertainment for everyone. Come join the fun and support our furry friends!',
            startDate: '03.09.2025',
            endDate: '03.09.2025',
            startTime: '09:00',
            likes: 56,
            comments: 21,
        },
        {
            id: 6,
            thumbnail: '/exampleNewYears.jpg',
            title: 'New Years Party',
            place: 'Amberg - Party Center',
            description: 'Celebrate the New Year with us! Enjoy fireworks, champagne for everyone, and a night full of fun and excitement. Don’t miss out on the best party to start the year right!',
            startDate: '31.12.2025',
            endDate: '01.01.2026',
            startTime: '20:00',
            likes: 17,
            comments: 3,
        }
    ]*/

    let loading: boolean|null = true;
    let error = null;

    const query = `
    query {
      eventList {
        id
        author {
          user_uri
          name
          email
          profilePicture
        }
        title
        description
        date
        time
        location
        address
        type
        thumbnail
        latitude
        longitude
        likeCount
        likedByMe
        attendCount
        attendedByMe
        commentCount
        attendees {
          user_uri
          name
          email
          profilePicture
        }
      }
    }
  `;

    onMount(async () => {
        try {
            const res = await fetch(GRAPHQL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            const json = await res.json();
            eventStoreActions.setEvents(json.data.eventList);
            console.log(json.data.eventList)
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    });

</script>

{#if loading}
    <div class="sosp-fullscreen-center">
        <div class="event-box">
            <div class="sosp-center-content">
                <!-- little loading wheel animation -->
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#541a46]"></div>
                <h2 class="event-header">
                    Loading...
                </h2>
            </div>
        </div>
    </div>
{:else if error}
    <p>Error while Loading: {error}</p>
{:else}
    <EventFeed events={$globalEvents} />
{/if}