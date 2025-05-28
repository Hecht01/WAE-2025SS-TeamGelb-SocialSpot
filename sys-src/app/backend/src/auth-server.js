import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import crypto from 'crypto';
import * as openid from 'openid-client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({path: '../../.env'});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    //secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

let redirectUri = process.env.REDIRECT_URI;
let scope = 'openid email profile';

let config = await openid.discovery(
    new URL('https://accounts.google.com'),
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
);

app.get('/api', (req, res) => {
    if (req.session.user) {
        res.send(`
      <h1>Welcome ${req.session.user.name}</h1>
      <img src="${req.session.user.picture}" alt="Profile Picture" style="width:100px;border-radius:50%;">
      <p>Email: ${req.session.user.email}</p>
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
    // Generate and store a code verifier and challenge
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
        /**
         * We cannot be sure the server supports PKCE so we're going to use state too.
         * Use of PKCE is backwards compatible even if the AS doesn't support it which
         * is why we're using it regardless. Like PKCE, random state must be generated
         * for every redirect to the authorization_endpoint.
         */
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
                //pkceCodeVerifier: req.session.codeVerifier,
                expectedState: req.session.expectedState,
            },
        )
        console.log('Token Endpoint Response', tokens)

        req.session.tokens = {
            access_token: tokens.access_token,
            expires_in: tokens.expires_in
        };

        if(tokens.scope.includes('https://www.googleapis.com/auth/userinfo')){
            /*let protectedResourceResponse = await openid.fetchProtectedResource(
                config,
                tokens.access_token,
                new URL('https://www.googleapis.com/auth/userinfo.email'),
                'GET',
            )*/

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

        // Redirect to home page
        res.redirect('/api');
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/logout', (req, res) => {
    // Clear session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/api');
    });
});

// Protected route example
app.get('/api/profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.session.user);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/api`);
});