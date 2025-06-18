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

    type Event{
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
        attendees: [User!]
    }

    type Query {
        event: [Event!]
        eventList: [Event!]
        getCreatedEvents: [Event!]
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
            latitude: Float
            longitude: Float
            categoryId: Int
            imageUrl: String
        ): ID!
        deleteEvent(id: ID!): Boolean!,
        attendEvent(id: ID!): Boolean!
        leaveEvent(id: ID!): Boolean!
        likeEvent(id: ID!): Boolean!
        removeLikeEvent(id: ID!): Boolean!
        commentEvent(
            id: ID!
            comment: String!
        ): Boolean!
    }
`;