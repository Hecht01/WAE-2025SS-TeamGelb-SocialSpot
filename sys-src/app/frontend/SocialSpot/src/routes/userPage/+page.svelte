<script lang="ts">
    import EventFeed from '$lib/components/EventFeed.svelte';
    import { onMount } from 'svelte';
    import type {EventData} from "$lib/types.js";

    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;
    let createdEvents: EventData[] = [];
    let loadingEvents: boolean|null = null;
    let errorEvents = null;

    const query = `
    query {
      getCreatedEvents {
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


    let user = null;
    let loading = true;
    let error = null;
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    $: isLoggedIn = !!user;

    onMount(async () => {
        await checkAuthStatus();

    });

    async function checkAuthStatus() {
        try {
            loading = true;
            const response = await fetch(`${BACKEND_URL}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    query: `
                        query MyUser {
                            myUser {
                                user_uri
                                name
                                email
                                profilePicture
                            }
                        }
                    `
                })
            });

            const result = await response.json();

            if (result.data && result.data.myUser) {
                user = {
                    name: result.data.myUser.name,
                    mail: result.data.myUser.email,
                    avatarUrl: result.data.myUser.profilePicture || "/dummyUser.jpg",
                    user_uri: result.data.myUser.user_uri
                };

                try {
                    console.log('Fetching Created Events')
                    const res = await fetch(GRAPHQL_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ query }),
                        credentials: 'include'
                    });
                    const json = await res.json();
                    createdEvents = json.data.getCreatedEvents;
                } catch (err) {
                    console.log('Error when fetching created Events')
                    errorEvents = err.message;
                } finally {
                    loadingEvents = false;
                }
            } else {
                user = null;
            }
        } catch (err) {
            console.error('Error checking auth status:', err);
            error = 'Failed to check authentication status';
            user = null;
        } finally {
            loading = false;
        }
    }

    function handleLogin() {
        window.location.href = `${BACKEND_URL}/api/auth-google`;
    }

    async function handleLogout() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/logout`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                user = null;
                window.location.reload();
            } else {
                console.error('Logout failed');
            }
        } catch (err) {
            console.error('Error during logout:', err);
        }
    }
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
    <div class="sosp-fullscreen-center">
        <div class="event-box">
            <div class="sosp-center-content">
                <h2 class="event-header">
                    Error
                </h2>
                <p class="event-p">{error}</p>
                <button on:click={checkAuthStatus} class="sosp-button-secondary">
                    Retry
                </button>
            </div>
        </div>
    </div>
{:else if isLoggedIn}
    <div class="sosp-profile-wrapper">
        <div class="sosp-container-userinfo">
            <div>
                <h2 class="sosp-profile-header">{user.name}'s profile</h2>
                <p class="event-p">Email: {user.mail}</p>
            </div>
            <div class="flex flex-col items-center gap-2">
                <img
                        src={user.avatarUrl}
                        alt="User Avatar"
                        class="sosp-avatar"/>
                <button on:click={handleLogout} class="sosp-button-secondary">
                    Log Out
                </button>
            </div>
        </div>

        <div class="sosp-profile-card">
            <h2 class="sosp-profile-header">Your Created Events</h2>

            <div class="sosp-profile-card-content">
                {#if loadingEvents}
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#541a46]"></div>
                    <h2 class="event-header">
                        Loading...
                    </h2>
                {:else if errorEvents}
                    <p>Error while Loading: {errorEvents}</p>
                {:else}
                    <EventFeed bind:events={createdEvents} />
                {/if}
            </div>
        </div>


        <!--
        <div class="sosp-profile-card">
            <h2 class="sosp-profile-header">Joined Events</h2>
            <div class="sosp-profile-card-content">
                <EventFeed {events}/>
            </div>
        </div>-->
    </div>

{:else}
    <div class="sosp-fullscreen-center">
        <div class="event-box">
            <div class="sosp-center-content">
                <h2 class="event-header">
                    Please Log In to continue to your profile
                </h2>
                <button on:click={handleLogin} class="google-button">
                    <img src="/GoogleLogo.jpg" alt="Google Logo" class="google-logo" />
                    Log-in with Google
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