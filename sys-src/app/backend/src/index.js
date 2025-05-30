import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as openid from 'openid-client';
import { ApolloServer } from "apollo-server-express";
import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from 'cors';


if (process.env.NODE_ENV !== 'production') {
    console.log('dev environment')
    await import('dotenv').then(dotenv => {
        dotenv.config({path: '../../.env'});
    });
}

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

const app = express();
const port = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://studio.apollographql.com'
    ],
    credentials: true
}));
app.use(cookieParser());
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
});
app.use(sessionMiddleware);

// OAuth configuration
let redirectUri = process.env.REDIRECT_URI;
let scope = 'openid email profile';

let config = await openid.discovery(
    new URL('https://accounts.google.com'),
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
);

// Create Apollo Server
const server = new ApolloServer({
    schema: addMocksToSchema({
        schema: makeExecutableSchema({ typeDefs, resolvers }),
        resolvers
    }),
});
await server.start();

server.applyMiddleware({
    app,
    path: '/graphql'
});

app.get('/api', (req, res) => {
    if (req.session.user) {
        res.send(`
      <h1>Welcome ${req.session.user.name}</h1>
      <img src="${req.session.user.picture}" alt="Profile Picture" style="width:100px;border-radius:50%;">
      <p>Email: ${req.session.user.email}</p>
      <p><a href="/graphql">GraphQL Playground</a></p>
      <a href="/api/logout">Logout</a>
    `);
    } else {
        res.send(`
      <h1>Welcome to OAuth Demo</h1>
      <a href="/api/auth-google">Login with Google</a>
    `);
    }
});

app.get('/api/auth-google', async (req, res) => {
    const codeVerifier = openid.randomPKCECodeVerifier()
    const codeChallenge = await openid.calculatePKCECodeChallenge(codeVerifier)

    let state;
    let parameters = {
        redirect_uri: redirectUri,
        scope: scope,
        codeChallenge: codeChallenge,
        code_challenge_method: 'S256',
    }

    if (!config.serverMetadata().supportsPKCE()) {
        state = openid.randomState()
        parameters.state = state
    }
    req.session.codeVerifier = codeVerifier;
    req.session.expectedState = state;

    let redirectTo = openid.buildAuthorizationUrl(config, parameters)
    console.log('redirecting to', redirectTo.href)
    res.redirect(redirectTo.href);
});

app.get('/api/auth/callback', async (req, res) => {
    try {
        let tokens = await openid.authorizationCodeGrant(
            config,
            new URL(`http://localhost:${port}${req.url}`),
            {
                expectedState: req.session.expectedState,
            },
        )
        console.log('Token Endpoint Response', tokens)

        req.session.tokens = {
            access_token: tokens.access_token,
            expires_in: tokens.expires_in
        };

        if(tokens.scope.includes('https://www.googleapis.com/auth/userinfo')){
            const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }
            const data = await response.json();

            console.log('data', data);

            req.session.user = {
                id: data.id,
                email: data.email,
                name: `${data.given_name} ${data.family_name}`,
                picture: data.picture
            };
        }

        res.redirect('/api');
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/api');
    });
});

app.get('/api/profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.session.user);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/api`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
});