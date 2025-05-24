<script>
    import EventBox from './EventBox.svelte';

    // dummy event list
    let events = [
        {
            image: '/exampleOpenMicNight.jpg',
            title: 'Open Mic Night',
            place: 'Amberg - Main Street 123',
            description: 'Open Mic Night Everyone Welcome!',
            startDate: '18.05.2025',
            endDate: '18.05.2025',
            startTime: '19:00',
            likes: 28,
            comments: 7,
        },
        {
            image: '/exampleDult.jpg',
            title: 'Amberger Dult',
            place: 'Amberg - Other Street 45',
            description: 'Come check out this years Dult! There is cotton candy and a lot of fun attractions!',
            startDate: '20.06.2025',
            endDate: '22.06.2025',
            startTime: '10:00',
            likes: 33,
            comments: 10,
        },
        {
            image: '/examplePride.jpg',
            title: 'Pride March 2025',
            place: 'Amberg - City Center',
            description: 'Join this years pride march. Going around the city starting from the city center.',
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
            description: 'Step into a world of knights, jesters, and noble ladies at our vibrant Renaissance Fair. Enjoy lively medieval music, thrilling sword fights, traditional crafts, and delicious market treats. A memorable adventure filled with history, fun, and fantasy for all ages!',
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
            description: 'You can meet all the cute animals, and if that is not enough there is also food and entertainment.',
            startDate: '03.09.2025',
            endDate: '03.09.2025',
            startTime: '09:00',
            likes: 56,
            comments: 21,
        },
        {
            image: '/exampleNewYears.jpg',
            title: 'New Years Party',
            place: 'Amberg - Party Center',
            description: 'Celebreate the New Years with us! We have fireworks and champagne for everyone',
            startDate: '31.12.2025',
            endDate: '01.01.2026',
            startTime: '20:00',
            likes: 17,
            comments: 3,
        }
    ]
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-6xl mx-auto">
    {#each events as event}
        <EventBox {...event}/>
    {/each}
</div>
