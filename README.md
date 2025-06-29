# SocialSpot
## Description 
SocialSpot is a social media like Web-App for creating and finding events.

## Installation
git clone https://github.com/Hecht01/WAE-2025SS-TeamGelb-SocialSpot.git

## Setup
- cd **sys-src**
- !!! copy .env.example file, save as .env !!!
- optional: change parameters such as POSTGRES_PASSWORD in .env
- for linux you might need to change "host.docker.internal" to "172.17.0.1"
- for authentification get GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from the Google API Console for OAuth
- for production usage adjust NGINX_CONF (should provide SSL certificates for nginx.prod.conf as well)
- cities require manual installation as of right now (sys-src/database/init/germany_gis.csv)

## Run
- cd **sys-src**
- docker compose up

## View in action
This application was deployed using Hetzner. As of right now (July 2025), you can view the page with this link: https://social-spot.space/

## Copyright and Licenses
This software is licensed under the MIT.
For detailed license information, see the LICENSE file in the project root.

## Used Tech
- SvelteKit
- express.js
- Apollo GraphQL
- OAuth 2.0
- Nominatim / OpenStreetMap
