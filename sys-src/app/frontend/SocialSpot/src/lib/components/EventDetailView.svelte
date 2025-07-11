<script lang="ts">
    import {eventPickedForDetailView, isOverlayOpen} from "../../stores/OverlayStore";
    import {Heart, MessageCircle} from "lucide-svelte";
    import {createEventActions} from "../../stores/eventInteractions";
    import {onMount} from "svelte";

    const IMAGE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/images/`;
    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

    let eventActions: any = null;
    let newComment = '';

    async function loadEventDetails(){
        if(!$eventPickedForDetailView)return;

        const query = `
            query GetEventDetails($eventId: ID!){
            getEventDetails(eventId: $eventId){
                    id
                    title
                    description
                    date
                    time
                    location
                    address
                    thumbnail
                    likeCount
                    likedByMe
                    attendCount
                    likedByMe
                    attendCount
                    attendedByMe
                    commentCount
                    author{
                        user_uri,
                        name,
                        email
                    }
                    comments{
                        id
                        content
                        author{
                            name
                            profilePicture
                        }
                    }
                }
            }
        `;
        try {
            const response = await fetch(GRAPHQL_URL, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    query,
                    variables: {eventId: $eventPickedForDetailView.id}
                }),
            });
            const result = await response.json();
            if(result.errors){
                throw new Error(result.errors[0].message);
            }
            console.log('Event details loaded:', result.data.getEventDetails);
            eventPickedForDetailView.set(result.data.getEventDetails);
        }catch(error){
            console.error('Failed to load event details', error);
        }
    }

    async function handleSumbitComment(){
        if(!eventActions || !newComment.trim()) return;
        const success = await eventActions.submitComment(newComment);
        if(success){
            newComment = '';
        }
        await loadEventDetails();
    }


    $: if ($eventPickedForDetailView) {
        eventActions = createEventActions($eventPickedForDetailView);
    }

    $: isLiked = eventActions?.isLiked;
    $: isJoined = eventActions?.isJoined;
    $: localLikeCount = eventActions?.localLikeCount;
    $: isLoading = eventActions?.isLoading;

    onMount(() => {
        if($eventPickedForDetailView) {
            loadEventDetails();
        }
    });
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
        if (e.key === 'Escape') {
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
            if (e.key === 'Escape') {
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
                                on:click={eventActions.toggleLike}
                                disabled={$isLoading}
                        >
                            <Heart
                                    class="w-5 h-5 text-white {$isLiked ? 'fill-current' : ''}"
                            />
                        </button>
                        <span>{$localLikeCount}</span>
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
                <p class="event-p"><strong>Created By:</strong> {$eventPickedForDetailView.author.name}</p>
                <button
                        class="sosp-button-secondary"
                        on:click={eventActions.toggleJoin}
                        disabled={$isLoading}
                >
                    {#if $isJoined}
                        Leave
                    {:else}
                        Join
                    {/if}
                </button>

                <div class="comments-section">
                    <h3>Comments ({$eventPickedForDetailView.comments?.length || 0})</h3>
                    <div class="comment-input-area">
                        <textarea
                            bind:value={newComment}
                            placeholder="Write a comment..."
                            class="w-full p-3 border rounded-lg resize-none"
                            rows="3"
                            disabled={$isLoading}
                        ></textarea>
                        <button
                                class="sosp-button-secondary mt-2"
                                on:click={handleSumbitComment}
                                disabled={$isLoading || !newComment.trim()}
                        >
                            {#if $isLoading}
                                Posting...
                            {:else}
                                Post Comment
                            {/if}
                        </button>
                    </div>

                    <div class="comments-list">
                        {#if $eventPickedForDetailView.comments && $eventPickedForDetailView.comments.length > 0}
                            {#each $eventPickedForDetailView.comments as comment}
                                <div class="comment-item">
                                    <div class="comment-header">
                                        <div class="comment-author-info">
                                            <span class="comment-author-name">{comment.author.name}</span>
                                        </div>
                                    </div>
                                    <p class="comment-content">{comment.content}</p>
                                </div>
                            {/each}
                        {:else}
                            <p class="no-comments">No comments yet. Be the first to comment!</p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>

<!-- should technically never happen but is here just in case for error handling -->
{:else}
    <div class="w-screen h-screen fixed top-0 left-0 flex justify-center items-center bg-[#1f1246] opacity-90 text-white">
        <p>No event selected.</p>
    </div>
{/if}
