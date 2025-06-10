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
        address: String!
        type: String!
        attendees: [User!]
        thumbnail: String
        latitude: Float
        longitude: Float
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
        ): Event!
        deleteEvent(id: ID!): Bool!
    }
`;