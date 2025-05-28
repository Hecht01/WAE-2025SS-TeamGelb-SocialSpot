const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const typeDefs = require("./schema");

const { addMocksToSchema } = require("@graphql-tools/mock");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const mocks = {
    Query: () => ({
        allEvents: () => [...new Array(1)],
    }),
    Event: () => ({
        id: () => "event_01",
        title: () => "Party im Bundestag",
        author: () => {
            return {
                id: "User_01",
                name: "Olaf Scholz",
                email:"olaf.scholz@gmail.com"
            };
        },
        description: () => "Party im Bundestag, Olaf geht ab",
        date:  () => "10.05.2025",
        time:  () => "20:30",
        location: () => "Berlin",
        address: () => "Platz der Republik 1, 11011 Berlin",
        type: () => "Party",
        thumbnail: () => "https://www.bundestag.de/resource/image/218498/16x9/1460/822/e0c4580af18d49e18c422437b47d7d14/FB55CF5ACCABD2CCF08FB2B61D466259/westportal01.jpg",
        latitude: () => 52.520008,
        longitude: () => 13.404954,

    }),
    User: () => ({
        id: () => "user_01",
        name: () => "Olaf Scholz",
        email: () => "olaf.scholz@gmail.com"
    })
};


async function startApolloServer() {
    const server = new ApolloServer({
        schema: addMocksToSchema({
            schema: makeExecutableSchema({ typeDefs }),
            mocks,
        }),
    });
    const { url } = await startStandaloneServer(server);
    console.log(`
    🚀  Server is running!
    📭  Query at ${url}
  `);
}

startApolloServer();