import gql from "graphql-tag";

export const typeDefs = gql`
    #Defining Schema here:
    type User {
        user_uri: ID!
        name: String!
        email: String!
        profilePicture: String
    }

    type City {
        id: ID!
        name: String!
        district: String!
        state: String!
    }

    type Event {
        id: ID!
        author:  User!
        title: String!
        description: String!
        date: String!
        time: String!
        location: String!
        address: String
        type: String!
        thumbnail: String
        latitude: Float
        longitude: Float,
        likeCount: Int!
        likedByMe: Boolean!
        attendCount: Int!
        attendedByMe: Boolean!
        commentCount: Int!
        comments: [Comment]
        attendees: [User!]
    }
    
    type Comment {
        id: ID!
        content: String
        commentedByMe: Boolean!
        date: String!
        author: User!
    }

    type Query {
        event: [Event!]
        eventList: [Event!]
        getCreatedEvents: [Event!]
        getEventDetails(
            eventId: ID!
        ): Event!
        user: User!
        myUser: User
        userList: [User!]
        getCities(
            nameLike: String
        ): [City!]!
    }

    type Mutation {
        createEvent(
            title: String!
            description: String!
            date: String!
            time: String!
            cityId: Int!
            address: String
            imageUrl: String
        ): ID
        deleteEvent(id: ID!): Boolean!,
        attendEvent(id: ID!): Boolean!
        leaveEvent(id: ID!): Boolean!
        likeEvent(id: ID!): Boolean!
        removeLikeEvent(id: ID!): Boolean!
        commentEvent(
            id: ID!
            comment: String!
        ): Boolean!
        deleteComment(id: ID!): Boolean!
    }
`;