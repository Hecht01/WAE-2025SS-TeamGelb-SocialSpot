import {writable} from "svelte/store";
import type {EventData} from "$lib/types.ts";

// Type for Event Updates
interface EventUpdate {
    eventId: string;
    type: 'like' | 'join';
    isLiked?: boolean;
    isJoined?: boolean;
    likeCount?: number;
    timestamp: number;
}

export const globalEvents = writable<EventData[]>([]);

export const eventUpdates = writable<EventUpdate | null>(null);

export const eventStoreActions = {
    setEvents: (events: EventData[]) => {
        globalEvents.set(events);
    },

    updateEvent: (eventId: string, updates: Partial<EventData>) => {
        globalEvents.update(events =>
            events.map(event =>
                event.id === eventId ? { ...event, ...updates } : event
            )
        );
    },

    updateEventLike: (eventId: string, isLiked: boolean, likeCount: number) => {
        globalEvents.update(events =>
        events.map(event =>
            event.id === eventId ? { ...event, likedByMe: isLiked, likeCount } : event)
        );

        eventUpdates.set({
            eventId,
            type: 'like',
            isLiked,
            likeCount,
            timestamp: Date.now()
        });
    },

    updateEventJoin: (eventId: string, isJoined: boolean) => {
        globalEvents.update(events =>
            events.map(event =>
            event.id === eventId ? {...event, attendedByMe: isJoined } : event)
        );

        eventUpdates.set({
            eventId,
            type: 'join',
            isJoined,
            timestamp: Date.now()
        });
    },

    getEventById: (eventId: string): EventData | undefined => {
        let foundEvent: EventData | undefined;
        globalEvents.subscribe(events => {
            foundEvent = events.find(event => event.id === eventId);
        })();
        return foundEvent;
    }
}