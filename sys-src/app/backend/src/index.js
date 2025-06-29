import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'path';
import cookieParser from 'cookie-parser';
import * as openid from 'openid-client';
import { ApolloServer } from "apollo-server-express";
import { addMocksToSchema } from "@graphql-tools/mock";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from 'cors';
import {pool, upsertUserGoogle} from './database.js';
import { fileURLToPath } from 'url';
import {uuidv4} from "@graphql-tools/mock/utils";
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
    console.log('dev environment')
    await import('dotenv').then(dotenv => {
        dotenv.config({path: '../../.env'});
    });
}

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import axios from "express-session/session/memory.js";

const app = express();
const port = process.env.BACKEND_PORT || 4000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Generate UUID and preserve file extension
        const uuid = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, uuid + extension);
    }
});
const upload = multer({ storage: storage });

const corsOptions = {
    origin: [
        ...(process.env.FRONTEND_URL
                ? [
                    process.env.FRONTEND_URL,
                    process.env.FRONTEND_URL.includes('://www.')
                        ? process.env.FRONTEND_URL.replace('://www.', '://')
                        : process.env.FRONTEND_URL.replace('://', '://www.')
                ]
                : ['http://localhost:3000']
        ),
        'https://studio.apollographql.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
};

app.options('*', cors(corsOptions));

app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

let sessionMiddleware;

if (process.env.NODE_ENV === 'production'){
    //nginx forwards per http and express expects SSL
    app.enable('trust proxy');

    sessionMiddleware = session({
        secret: process.env.secret || 'Super Secure Secret',
        proxy: true,
        resave: false,
        saveUninitialized: false,
        name: 'session.sid',
        cookie: {
            secure: true,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'none',
        }
    });
} else {
    sessionMiddleware = session({
        secret: process.env.secret || 'Super Secure Secret',
        resave: false,
        saveUninitialized: false,
        name: 'session.sid',
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax',
        }
    });
}

app.use(sessionMiddleware);

// OAuth configuration
let redirectUri = process.env.REDIRECT_URI;
let scope = 'openid email profile';

let config = await openid.discovery(
    new URL('https://accounts.google.com'),
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
);

try {
    const server = new ApolloServer({
        schema: addMocksToSchema({
            schema: makeExecutableSchema({ typeDefs, resolvers }),
            resolvers,
        }),
        context: ({ req, res }) => {
            return {
                req,
                res
            };
        },
        cors: {
            origin: corsOptions.origin,
            credentials: true
        }
    });

    await server.start();

    server.applyMiddleware({
        app,
        path: '/graphql',
        cors: false
    });

} catch (error) {
    console.error('Schema error:', error);
}

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
    res.redirect(redirectTo.href);
});

app.get('/api/auth/callback', async (req, res) => {
    try {
        let tokens = await openid.authorizationCodeGrant(
            config,
            new URL(`${process.env.BACKEND_URL}${req.url}`),
            {
                expectedState: req.session.expectedState,
            },
        )

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

            const userData = await upsertUserGoogle(data);

            //TODO: handle new user..?
            if(userData.success) {
                req.session.user = userData.user;
                req.session.save();
            }
        }
        const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/userPage`;
        res.redirect(frontendUrl);
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
        return res.send(200);

    });
});

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};

app.get('/api/profile', requireAuth, (req, res) => {
    res.json(req.session.user);
});

app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const query = `
            INSERT INTO uploaded_images (user_id, image_url)
            VALUES ($1, $2)
        `;

        const result = await pool.query(query, [
            req.session.user.user_id,
            req.file.filename
        ]);

        res.json({
            message: "Upload successful",
            filename: req.file.filename
        });

    } catch (error) {
        console.error('Database error:', error);

        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        res.status(500).json({
            error: 'Failed to save image information to database'
        });
    }
})


const staticFilesPath = path.join(__dirname, '..', 'uploads');

console.log(`[Express Static] Attempting to serve images from: ${staticFilesPath}`);
console.log(`[Express Static] Does this path exist? Check filesystem.`);

app.use('/api/images', express.static(staticFilesPath));

app.listen(port, () => {
    console.log(`Server running on ${process.env.BACKEND_URL}/api`);
    console.log(`GraphQL endpoint: ${process.env.BACKEND_URL}/graphql`);
})

