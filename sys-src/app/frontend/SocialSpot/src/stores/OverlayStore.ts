import { writable } from 'svelte/store';
import type { EventData } from '$lib/types';

// controls if the detail view overlay is open
export const isOverlayOpen = writable(false);

// saves the info for the event that is to be displayed in the detail view; starts as null so its empty
export const eventPickedForDetailView = writable<EventData | null>(null);