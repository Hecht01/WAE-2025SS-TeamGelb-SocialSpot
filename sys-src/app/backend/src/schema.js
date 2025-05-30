const gql = require("graphql-tag");

const typeDefs = gql`
    #Defining Schema here:
    type User {
        id: ID!
        name: String!
        email: String!
        profilePicture: String
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
        event: [Event!]!
        eventList: [Event!]!
        user: User!
        userList: [User!]!
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
            creatorId: Int!
            categoryId: Int
            imageUrl: String
        ): Event!
    }
`;
module.exports = typeDefs;