# KajianNow

**Find *kajian sunnah* (Islamic study gatherings) near you — when and where, straight from the map.**

KajianNow is a mobile-first Progressive Web App that helps Muslims in Indonesia
discover nearby kajian: what's happening now, what's coming up, and what has
finished. It's built with React + Vite and is free to use, forever.

> _Dibuat untuk umat, gratis selamanya._

## Features

- 🗺️ **Interactive map** — browse kajian near you on an interactive map (Leaflet / Google Maps).
- ⏱️ **Live status** — see at a glance which kajian are ongoing, upcoming, or finished.
- 🔔 **Push notifications** — get notified about kajian via web push.
- 🕌 **Prayer times** — powered by [`adhan`](https://github.com/batoulapps/adhan-js).
- 📍 **Location-aware** — filter by city, category, and date.
- 📱 **Installable PWA** — add it to your home screen and use it like a native app.

## Tech stack

| Area | Tools |
|------|-------|
| Framework | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Routing | [React Router](https://reactrouter.com/) |
| Maps | [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/), [Google Maps](https://github.com/JustFly1984/react-google-maps-api) |
| Dates & times | [date-fns](https://date-fns.org/), [moment-timezone](https://momentjs.com/timezone/), [adhan](https://github.com/batoulapps/adhan-js) |
| HTTP | [axios](https://axios-http.com/) |
| Testing | [Playwright](https://playwright.dev/) (E2E) |
| Linting | [ESLint](https://eslint.org/) |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Run locally with Vite

```sh
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The app will be available at `http://localhost:5173`.

### Run with Docker

```sh
docker compose build
docker compose up
```

## Environment variables

Copy `.env.example` to `.env` and set the following:

| Variable | Description |
|----------|-------------|
| `VITE_BASE_URL` | Base URL of the KajianNow backend API. |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID public key (the backend holds the matching private key). Background push is disabled until this is set. Generate with `npx web-push generate-vapid-keys`. |

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the project. |
| `npm run test:e2e` | Run the Playwright end-to-end tests. |
| `npm run test:e2e:ui` | Run the Playwright tests in UI mode. |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for
details on our branch naming, commit conventions, and pull request process.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
