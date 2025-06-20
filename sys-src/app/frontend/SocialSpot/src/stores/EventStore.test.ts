import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { globalEvents, eventUpdates, eventStoreActions } from './EventStore';

describe('EventStore', () => {
    const mockEvents = [
        {
            id: '1',
            title: 'Event 1',
            date: '2025-07-01',
            time: '14:00:00',
            location: 'Location 1',
            description: 'Description 1',
            thumbnail: 'image1.jpg',
            likeCount: 5,
            commentCount: 2,
            likedByMe: false,
            attendedByMe: false,
            author: {
                user_uri: 'user1',
                name: 'User 1',
                email: 'user1@test.com',
                profilePicture: 'user1-profile.jpg'
            },
            address: 'Address 1',
            type: 'Type 1',
            latitude: 51.5,
            longitude: 10.1,
            attendCount: 10,
            attendees: {
                user_uri: 'attendee1',
                name: 'Test Attendee 1',
                email: 'attendee1@test.com',
                profilePicture: 'attendee1-profile.jpg'
            }
        },
        {
            id: '2',
            title: 'Event 2',
            date: '2025-07-02',
            time: '16:00:00',
            location: 'Location 2',
            description: 'Description 2',
            thumbnail: 'image2.jpg',
            likeCount: 10,
            commentCount: 4,
            likedByMe: true,
            attendedByMe: true,
            author: {
                user_uri: 'user2',
                name: 'User 2',
                email: 'user2@test.com',
                profilePicture: 'user2-profile.jpg'
            },
            address: 'Address 2',
            type: 'Type 2',
            latitude: 52.5,
            longitude: 11.1,
            attendCount: 20,
            attendees: {
                user_uri: 'attendee2',
                name: 'Test Attendee 2',
                email: 'attendee2@test.com',
                profilePicture: 'attendee2-profile.jpg'
            }
        }
    ];

    beforeEach(() => {
        // Reset stores to initial state
        globalEvents.set([]);
        eventUpdates.set(null);
    });

    describe('globalEvents store', () => {
        it('has initial value of empty array', () => {
            expect(get(globalEvents)).toEqual([]);
        });

        it('can store events', () => {
            globalEvents.set(mockEvents);
            expect(get(globalEvents)).toEqual(mockEvents);
        });

        it('notifies subscribers when events change', () => {
            let currentEvents: any[] = [];
            const unsubscribe = globalEvents.subscribe(events => {
                currentEvents = events;
            });

            globalEvents.set(mockEvents);
            expect(currentEvents).toEqual(mockEvents);

            unsubscribe();
        });
    });

    describe('eventUpdates store', () => {
        it('has initial value of null', () => {
            expect(get(eventUpdates)).toBeNull();
        });

        it('can store update objects', () => {
            const update = {
                eventId: '1',
                type: 'like' as const,
                isLiked: true,
                likeCount: 6,
                timestamp: Date.now()
            };

            eventUpdates.set(update);
            expect(get(eventUpdates)).toEqual(update);
        });
    });

    describe('eventStoreActions', () => {
        beforeEach(() => {
            globalEvents.set(mockEvents);
        });

        describe('setEvents', () => {
            it('sets events in the store', () => {
                const newEvents = [mockEvents[0]];
                eventStoreActions.setEvents(newEvents);
                expect(get(globalEvents)).toEqual(newEvents);
            });

            it('replaces existing events', () => {
                const newEvents = [
                    {
                        ...mockEvents[0],
                        title: 'Updated Event'
                    }
                ];
                eventStoreActions.setEvents(newEvents);
                expect(get(globalEvents)).toEqual(newEvents);
                expect(get(globalEvents)).toHaveLength(1);
            });
        });

        describe('updateEvent', () => {
            it('updates specific event properties', () => {
                eventStoreActions.updateEvent('1', { title: 'Updated Title' });

                const events = get(globalEvents);
                const updatedEvent = events.find(e => e.id === '1');
                expect(updatedEvent?.title).toBe('Updated Title');
                expect(updatedEvent?.location).toBe('Location 1'); // Other properties should remain
            });

            it('does not affect other events', () => {
                eventStoreActions.updateEvent('1', { title: 'Updated Title' });

                const events = get(globalEvents);
                const otherEvent = events.find(e => e.id === '2');
                expect(otherEvent?.title).toBe('Event 2'); // Should remain unchanged
            });

            it('handles non-existent event id gracefully', () => {
                const originalEvents = get(globalEvents);
                eventStoreActions.updateEvent('999', { title: 'Non-existent' });

                expect(get(globalEvents)).toEqual(originalEvents); // Should remain unchanged
            });
        });

        describe('updateEventLike', () => {
            it('updates event like status and count', () => {
                eventStoreActions.updateEventLike('1', true, 6);

                const events = get(globalEvents);
                const updatedEvent = events.find(e => e.id === '1');
                expect(updatedEvent?.likedByMe).toBe(true);
                expect(updatedEvent?.likeCount).toBe(6);
            });

            it('creates eventUpdate with like information', () => {
                const beforeTimestamp = Date.now();
                eventStoreActions.updateEventLike('1', true, 6);
                const afterTimestamp = Date.now();

                const update = get(eventUpdates);
                expect(update).not.toBeNull();
                expect(update?.eventId).toBe('1');
                expect(update?.type).toBe('like');
                expect(update?.isLiked).toBe(true);
                expect(update?.likeCount).toBe(6);
                expect(update?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
                expect(update?.timestamp).toBeLessThanOrEqual(afterTimestamp);
            });

            it('handles unlike action', () => {
                eventStoreActions.updateEventLike('2', false, 9);

                const events = get(globalEvents);
                const updatedEvent = events.find(e => e.id === '2');
                expect(updatedEvent?.likedByMe).toBe(false);
                expect(updatedEvent?.likeCount).toBe(9);
            });
        });

        describe('updateEventJoin', () => {
            it('updates event join status', () => {
                eventStoreActions.updateEventJoin('1', true);

                const events = get(globalEvents);
                const updatedEvent = events.find(e => e.id === '1');
                expect(updatedEvent?.attendedByMe).toBe(true);
            });

            it('creates eventUpdate with join information', () => {
                const beforeTimestamp = Date.now();
                eventStoreActions.updateEventJoin('1', true);
                const afterTimestamp = Date.now();

                const update = get(eventUpdates);
                expect(update).not.toBeNull();
                expect(update?.eventId).toBe('1');
                expect(update?.type).toBe('join');
                expect(update?.isJoined).toBe(true);
                expect(update?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
                expect(update?.timestamp).toBeLessThanOrEqual(afterTimestamp);
            });

            it('handles leave action', () => {
                eventStoreActions.updateEventJoin('2', false);

                const events = get(globalEvents);
                const updatedEvent = events.find(e => e.id === '2');
                expect(updatedEvent?.attendedByMe).toBe(false);
            });
        });

        describe('getEventById', () => {
            it('returns correct event by id', () => {
                const event = eventStoreActions.getEventById('1');
                expect(event).toBeDefined();
                expect(event?.id).toBe('1');
                expect(event?.title).toBe('Event 1');
            });

            it('returns undefined for non-existent id', () => {
                const event = eventStoreActions.getEventById('999');
                expect(event).toBeUndefined();
            });

            it('returns updated event after modification', () => {
                eventStoreActions.updateEvent('1', { title: 'Modified Title' });
                const event = eventStoreActions.getEventById('1');
                expect(event?.title).toBe('Modified Title');
            });
        });

        describe('store integration', () => {
            it('multiple updates work correctly', () => {
                eventStoreActions.updateEventLike('1', true, 6);
                eventStoreActions.updateEventJoin('1', true);

                const event = eventStoreActions.getEventById('1');
                expect(event?.likedByMe).toBe(true);
                expect(event?.likeCount).toBe(6);
                expect(event?.attendedByMe).toBe(true);
            });

            it('eventUpdates store gets overwritten by subsequent updates', () => {
                eventStoreActions.updateEventLike('1', true, 6);
                const firstUpdate = get(eventUpdates);

                eventStoreActions.updateEventJoin('2', true);
                const secondUpdate = get(eventUpdates);

                expect(firstUpdate?.type).toBe('like');
                expect(secondUpdate?.type).toBe('join');
                expect(secondUpdate?.eventId).toBe('2');
            });
        });
    });
});