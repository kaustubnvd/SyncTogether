<!-- <p align="center">
    <img src="/assets/vb_logo.png" alt="SyncTogether Logo" width="72" height="72">
</p> -->
<h3 align="center">SyncTogether</h3>

<p align="center">
    Watch YouTube videos synced in real-time, together with your friends. Create your own personal room and invite your friends for a YouTube watch party!
</p>
<p align="center">
<a href="https://www.synctogether.tv/">Try it Out</a>
·
<a href="https://github.com/kaustubnvd/SyncTogether/issues">Report Bug</a>
·
<a href="https://github.com/kaustubnvd/SyncTogether/issues">Request Feature</a>
</p>
<p align="center">
    <img src="https://user-images.githubusercontent.com/37305714/87588735-c24fbe00-c6a9-11ea-975d-55b97825ae57.gif" alt="demo">
<p>

## Getting Started

Follow the steps below to set up a local development environment for this project.

### Prerequisites

Make sure you have Node.js and npm installed locally on your system.
* node
* npm

### Development Setup

1. Clone the repo
```sh
git clone https://github.com/kaustubnvd/SyncTogether.git
```
2. Install NPM packages
```sh
npm install
```
3. Get an API key for YouTube Data v3 [here](https://developers.google.com/youtube/v3/getting-started)

4. Create a .env file and enter your API key
```
YOUTUBE_API_KEY=YOUR_API_KEY
```
5. Start a dev environment
```sh
npm run dev
```

## Built With
The following frameworks and APIs are core to the application.
* [Socket.IO](https://socket.io/)
* [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference)
* [Express.js](https://expressjs.com/)
