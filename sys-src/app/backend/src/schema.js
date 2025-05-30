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
`;
module.exports = typeDefs;