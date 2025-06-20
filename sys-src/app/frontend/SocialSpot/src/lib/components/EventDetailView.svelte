<script lang="ts">
    import {eventPickedForDetailView, isOverlayOpen} from "../../stores/OverlayStore";
    import {Heart, MessageCircle} from "lucide-svelte";

    const IMAGE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/images/`;
    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

    let isLiked = false;
    let isJoined = false;
    let localLikeCount = 0;
    let isLoading = false;

    $: if($eventPickedForDetailView){
        isLiked = $eventPickedForDetailView.likedByMe || false;
        isJoined = $eventPickedForDetailView.attendedByMe || false;
        localLikeCount = $eventPickedForDetailView.likeCount || 0;
    }

    // mutation helper function
    async function executeMutation(mutation:string, variables: any = {}){
        try {
            isLoading = true;
            const response = await fetch(GRAPHQL_URL, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    query: mutation,
                    variables: variables,
                })
            });

            const result = await response.json();

            if (result.errors){
                console.error('GraphQL error', result.errors);
                throw new Error(result.errors[0].message);
            }

            return result.data;
        } catch (error) {
            console.log('Error with Mutation:', error);
            throw error;
        } finally {
            isLoading = false;
        }
    }

    async function toggleLike(){
        if(!$eventPickedForDetailView || isLoading) return; //should not be possible anyway, but just in case

        const eventId = $eventPickedForDetailView.id;
        const wasLiked = isLiked;
        isLiked = !isLiked;
        localLikeCount += isLiked ? 1 : -1; //add or subtract depending on if event is liked

        try {
            if(isLiked){
                const mutation = `
                    mutation LikeEvent($id: ID!) {
                        likeEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: eventId});
            } else {
                const mutation = `
                    mutation RemoveLikeEvent($id: ID!) {
                        removeLikeEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: eventId});
            }
        } catch (error) {
            isLiked = wasLiked; // revert to before failed like attempt
            localLikeCount += wasLiked ? 1 : -1;
            alert('Failed to update like status. Please try again.')
        }
    }

    async function toggleJoin() {
        if(!$eventPickedForDetailView || isLoading) return;

        const eventId = $eventPickedForDetailView.id;
        const wasJoined = isJoined;
        isJoined = !isJoined;

        try {
            if (isJoined){
                const mutation = `
                    mutation AttendEvent($id: ID!) {
                        attendEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: eventId})
            } else {
                const mutation = `
                    mutation LeaveEvent($id: ID!) {
                        leaveEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: eventId})
            }
        } catch (error){
            isJoined = wasJoined;
            if(error.message.includes('Authentication required')){
                alert('Please log in to join/leave events')
            } else {
                alert('Failed to update attendance status. Please try again')
            }
        }
    }


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

                <div class="event-image-overlay">
                    <div class="event-image-overlay-item">
                        <!-- disabled means you cant click on a button while that field is true -->
                        <button
                                on:click={toggleLike}
                                disabled={isLoading}
                        >
                            <Heart
                                    class="w-5 h-5 text-white {isLiked ? 'fill-current' : ''}"
                            />
                        </button>
                        <span>{localLikeCount}</span>
                    </div>
                    <div class="event-image-overlay-item">
                        <MessageCircle class="w-5 h-5 text-white" />
                        <span>{$eventPickedForDetailView.commentCount}</span>
                    </div>

                </div>

            </div>

            <div class="event-infos">
                <h2 class="event-header">{$eventPickedForDetailView.title}</h2>
                <p class="event-p"><strong>Date:</strong> {$eventPickedForDetailView.date}; Time: {$eventPickedForDetailView.time.substring(0,5)}</p>
                <p class="event-p"><strong>Place:</strong> {$eventPickedForDetailView.location}</p>
                <p class="event-p"><strong>Address:</strong> {$eventPickedForDetailView.address}</p>
                <p class="event-p"><strong>Description:</strong> {$eventPickedForDetailView.description}</p>
                <button
                        class="sosp-button-secondary"
                        on:click={toggleJoin}
                        disabled={isLoading}
                >
                    {#if isJoined}
                        Leave
                    {:else}
                        Join
                    {/if}
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
