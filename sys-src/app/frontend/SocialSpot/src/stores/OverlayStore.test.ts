import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { isOverlayOpen, eventPickedForDetailView } from './OverlayStore';

describe('OverlayStore', () => {
    beforeEach(() => {
        // Reset stores to initial state
        isOverlayOpen.set(false);
        eventPickedForDetailView.set(null);
    });

    describe('isOverlayOpen store', () => {
        it('has initial value of false', () => {
            expect(get(isOverlayOpen)).toBe(false);
        });

        it('can be set to true', () => {
            isOverlayOpen.set(true);
            expect(get(isOverlayOpen)).toBe(true);
        });

        it('can be toggled between true and false', () => {
            isOverlayOpen.set(true);
            expect(get(isOverlayOpen)).toBe(true);

            isOverlayOpen.set(false);
            expect(get(isOverlayOpen)).toBe(false);
        });

        it('can be updated with update function', () => {
            isOverlayOpen.update(value => !value);
            expect(get(isOverlayOpen)).toBe(true);

            isOverlayOpen.update(value => !value);
            expect(get(isOverlayOpen)).toBe(false);
        });

        it('notifies subscribers when value changes', () => {
            let currentValue = false;
            const unsubscribe = isOverlayOpen.subscribe(value => {
                currentValue = value;
            });

            isOverlayOpen.set(true);
            expect(currentValue).toBe(true);

            isOverlayOpen.set(false);
            expect(currentValue).toBe(false);

            unsubscribe();
        });
    });

    describe('eventPickedForDetailView store', () => {
        const mockEvent = {
            id: '1',
            title: 'Test Event',
            date: '2025-07-01',
            time: '14:00:00',
            location: 'Test Location',
            address: 'Test Address',
            description: 'Test Description',
            thumbnail: 'test.jpg',
            type: 'Social',
            latitude: 51.5,
            longitude: 10.1,
            likeCount: 5,
            commentCount: 3,
            likedByMe: false,
            attendedByMe: false,
            attendCount: 10,
            author: {
                user_uri: 'user1',
                name: 'Test Author',
                email: 'author@test.com',
                profilePicture: 'default-profile.jpg'
            },
            attendees: {
                user_uri: 'attendee1',
                name: 'Test Attendee',
                email: 'attendee@test.com',
                profilePicture: 'attendee-profile.jpg'
            }
        };

        it('has initial value of null', () => {
            expect(get(eventPickedForDetailView)).toBeNull();
        });

        it('can store an event object', () => {
            eventPickedForDetailView.set(mockEvent);
            expect(get(eventPickedForDetailView)).toEqual(mockEvent);
        });

        it('can be reset to null', () => {
            eventPickedForDetailView.set(mockEvent);
            expect(get(eventPickedForDetailView)).toEqual(mockEvent);

            eventPickedForDetailView.set(null);
            expect(get(eventPickedForDetailView)).toBeNull();
        });

        it('can store different event objects', () => {
            const anotherEvent = {
                ...mockEvent,
                id: '2',
                title: 'Another Event'
            };

            eventPickedForDetailView.set(mockEvent);
            expect(get(eventPickedForDetailView)).toEqual(mockEvent);

            eventPickedForDetailView.set(anotherEvent);
            expect(get(eventPickedForDetailView)).toEqual(anotherEvent);
        });

        it('notifies subscribers when value changes', () => {
            let currentValue = null;
            const unsubscribe = eventPickedForDetailView.subscribe(value => {
                currentValue = value;
            });

            eventPickedForDetailView.set(mockEvent);
            expect(currentValue).toEqual(mockEvent);

            eventPickedForDetailView.set(null);
            expect(currentValue).toBeNull();

            unsubscribe();
        });

        it('can update event properties', () => {
            eventPickedForDetailView.set(mockEvent);

            eventPickedForDetailView.update(event => {
                if (event) {
                    return { ...event, title: 'Updated Title' };
                }
                return event;
            });

            const updatedEvent = get(eventPickedForDetailView);
            expect(updatedEvent?.title).toBe('Updated Title');
            expect(updatedEvent?.id).toBe('1'); // Other properties should remain
        });
    });

    describe('store coordination', () => {
        const mockEvent = {
            id: '1',
            title: 'Test Event',
            date: '2025-07-01',
            time: '14:00:00',
            location: 'Test Location',
            address: 'Test Address',
            description: 'Test Description',
            thumbnail: 'test.jpg',
            type: 'Social',
            latitude: 51.5,
            longitude: 10.1,
            likeCount: 5,
            commentCount: 3,
            likedByMe: false,
            attendedByMe: false,
            attendCount: 10,
            author: {
                user_uri: 'user1',
                name: 'Test Author',
                email: 'author@test.com',
                profilePicture: 'default-profile.jpg'
            },
            attendees: {
                user_uri: 'attendee1',
                name: 'Test Attendee',
                email: 'attendee@test.com',
                profilePicture: 'attendee-profile.jpg'
            }
        };

        it('can simulate opening overlay with event', () => {
            // Simulate the behavior when opening detail view
            eventPickedForDetailView.set(mockEvent);
            isOverlayOpen.set(true);

            expect(get(isOverlayOpen)).toBe(true);
            expect(get(eventPickedForDetailView)).toEqual(mockEvent);
        });

        it('can simulate closing overlay', () => {
            // Setup: open overlay with event
            eventPickedForDetailView.set(mockEvent);
            isOverlayOpen.set(true);

            // Simulate closing
            isOverlayOpen.set(false);
            eventPickedForDetailView.set(null);

            expect(get(isOverlayOpen)).toBe(false);
            expect(get(eventPickedForDetailView)).toBeNull();
        });

        it('maintains independence between stores', () => {
            // Setting one store shouldn't automatically affect the other
            isOverlayOpen.set(true);
            expect(get(eventPickedForDetailView)).toBeNull();

            eventPickedForDetailView.set(mockEvent);
            // isOverlayOpen should still be true from before
            expect(get(isOverlayOpen)).toBe(true);
        });
    });
});