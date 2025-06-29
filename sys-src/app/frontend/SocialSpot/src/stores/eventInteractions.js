import {writable} from 'svelte/store';
import {eventStoreActions} from "./EventStore.js";

const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

// mutation helper function
/**
 * @param {string} mutation
 * @param {any} variables
 */
async function executeMutation(mutation, variables = {}){
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
}

/**
 * @param {any} event
 * @param {Function|null} onUpdate
 */
export function createEventActions(event, onUpdate = null){
    // reactive stores for frontend
    const isLiked = writable(event.likedByMe || false);
    const isJoined = writable(event.attendedByMe || false);
    const localLikeCount = writable(event.likeCount || 0);
    const isLoading = writable(false)

    async function toggleLike(){
        const currentLiked = await new Promise(resolve => {
            isLiked.subscribe(value => {
                resolve(value);
            })();
        });

        const wasLiked = currentLiked;
        const newLikedState = !currentLiked;

        // update local
        isLiked.set(newLikedState);
        localLikeCount.update(count => count + (newLikedState ? 1: -1));
        isLoading.set(true);

        try{
            if(newLikedState) {
                const mutation = `
                    mutation LikeEvent($id: ID!){
                        likeEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: event.id})
            } else {
                const mutation = `
                    mutation RemoveLikeEvent($id: ID!){
                        removeLikeEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: event.id})
            }

        // update global store
        const currentLikeCount = await new Promise(resolve => {
            localLikeCount.subscribe(value => {
                resolve(value);
            })();
        });

        eventStoreActions.updateEventLike(event.id, newLikedState, currentLikeCount);

        } catch (error) {
            isLiked.set(wasLiked);
            localLikeCount.update(count => count + (wasLiked ? 1 : -1));
            alert('Failed to update like status. Please try again');
        } finally {
            isLoading.set(false);
        }
    }

    async function toggleJoin() {
        const currentJoined = await new Promise(resolve => {
            isJoined.subscribe(value => {
                resolve(value);
            })();
        });

        const wasJoined = currentJoined;
        const newJoinedState = !currentJoined;

        isJoined.set(newJoinedState);
        isLoading.set(true);

        try {
            if(newJoinedState) {
                const mutation = `
                    mutation AttendEvent($id: ID!){
                        attendEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: event.id})
            } else {
                const mutation = `
                    mutation LeaveEvent($id: ID!){
                        leaveEvent(id: $id)
                    }
                `;
                await executeMutation(mutation, {id: event.id})
            }

        // update global store
        eventStoreActions.updateEventJoin(event.id, newJoinedState);

        } catch (error) {
            isJoined.set(wasJoined);
            const err = error instanceof Error ? error : new Error(String(error));
            if (err.message.includes('Authentication required')) {
                alert('Please log in to join/leave events');
            } else {
                alert('Failed to update attendance status. Please try again');
            }
        } finally {
            isLoading.set(false);
        }
    }

    return {
        isLiked, isJoined, localLikeCount, isLoading, toggleLike, toggleJoin, submitComment
    };

    /**
     * @param {any} commentText
     */
    async function submitComment(commentText){
        if(!commentText.trim()) return;
        isLoading.set(true);
        try{
            const mutation = `
                mutation CommentEvent($id: ID!, $comment: String!){
                    commentEvent(id: $id, comment: $comment)
                }
            `;
            await executeMutation(mutation, {id: event.id, comment: commentText.trim()});

            if(onUpdate){
                setTimeout(async ()=>{
                    await onUpdate();
                }, 500);
            }

            return true;
        } catch(error){
            console.error('Comment submission error:', error);
            const err =error instanceof Error ? error : new Error(String(error));
            if(err.message.includes('Authentication required')) {
                alert('Please log in to comment');
            } else {
                alert('Failed to post comment. Please try again');
            }
            return false;
        } finally {
            isLoading.set(false);
        }
    }

}