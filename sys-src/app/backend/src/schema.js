import gql from "graphql-tag";

export const typeDefs = gql`
    type User {
        id: ID!
        user_uri: String
        name: String!
        email: String!
        profilePicture: String
    }

    type Event {
        id: ID!
        title: String!
        description: String
        date: String!
        time: String!
        location: String
        address: String
        type: String
        latitude: Float
        longitude: Float
        thumbnail: String
        author: User!
        attendees: [User!]!
    }

    type City {
        id: ID!
        name: String!
        district: String
        state: String
    }

    type Query {
        userList: [User!]!
        eventList: [Event!]!
        myUser: User
        getCreatedEvents: [Event!]!
        getCities(nameLike: String): [City!]!
    }

    type Mutation {
        createEvent(
            title: String!
            description: String!
            date: String!
            time: String!
            cityId: Int
            address: String
            latitude: Float
            longitude: Float
            categoryId: Int
            imageUrl: String
            city: String
            state: String
            country: String
        ): Event!

        deleteEvent(eventId: ID!): Boolean!
    }
`;