# Starship Rental Dashboard

A modern, responsive dashboard for managing starship rentals, built with [Astro](https://astro.build/), [Vaadin Web Components](https://vaadin.com/components), and [Supabase](https://supabase.com/). This project provides an administrative interface for handling starship inventory, rental tickets, locations, and user preferences, with real-time network monitoring and theme support.

This project is based on and inspired by the [StarPass demo by Vaadin](https://vaadin.com/showcase/starpass), replicating its theme and interface with some variations and the addition of new actions and features.

## Overview

The main goal of this project was to explore and learn Vanilla JavaScript/TypeScript while experimenting with an unconventional tech stack.

### Hybrid Architecture
The application implements a hybrid architecture that combines:
- **Single Page Application (SPA)** features
- **Server-Side Rendering (SSR)** capabilities through Astro's server output mode and Supabase SSR

### Client-Side Features
- **Custom Router:** Built with URLPattern API for smooth navigation
- **Event-Based Middleware Pattern:**
  - Intercepts route changes
  - Validates user sessions (JWT tokens)
  - Manages authentication state (Supabase)
  - Handles token refreshing
  - Controls user redirections

### Server-Side Features
- **Middleware Protection:**
  - Authentication validation
  - Session management
  - API route protection
  - Secure resource access

### Technical Implementation
- **Components:** Combines both class-based and functional approaches
- **UI Framework:** Leverages Vaadin web components
- **Rendering:** Uses lit-html for efficient DOM updates
- **Security:** Implements dual-layer protection through client and server middleware
- **Session Management:** Coordinated validation between client and server

This unique combination creates an interesting blend of modern web technologies that, while unusual, demonstrates different approaches to building web applications beyond traditional frameworks.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Starship Management:** View, edit, and manage starship details and images.
- **Rental Tickets:** Track and update rental tickets with status badges and details.
- **Location Management:** Manage rental locations and related data.
- **Theme Support:** System and user-preferred dark/light themes.
- **Network Monitoring:** Detects online/offline status and notifies users.
- **Responsive UI:** Built with Vaadin Web Components for a seamless experience.
- **Authentication:** Integrates with Supabase for secure user management.
- **File Uploads:** Supports uploading and managing images/files for starships and locations.

---

## Tech Stack

- **Frontend:** [Astro](https://astro.build/), [Vaadin Web Components](https://vaadin.com/components), [URLPattern Router](https://github.com/thepassle/app-tools/tree/master/router),  [Lit-HTML](https://lit.dev/)
- **Backend/API:** [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
- **State Management:** [Nanostores](https://nanostores.github.io/nanostores/)
- **Validation:** [Zod](https://zod.dev/)
- **TypeScript:** Full type safety across the codebase
- **AI:** Copilot, ChatGPT, Claude, DeepSeek

---

## Project Structure

```
.
├── public/                # Static assets (SVGs, images, etc.)
├── src/
│   ├── components/        # UI components (grids, panels, forms, etc.)
│   ├── controllers/       # Business logic (theme, user preferences)
│   ├── pages/             # Astro pages and API routes
│   ├── utils/             # Utility functions (network, validation, etc.)
│   ├── base/              # Base classes for panels and components
│   ├── schema/            # Zod schemas for validation
│   ├── lib/               # Supabase and server-side utilities
│   └── index.ts           # Main entry point, Vaadin setup, theme, network
├── .astro/                # Astro-generated types and configs
├── package.json
├── tsconfig.json
├── astro.config.mjs
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- [Supabase](https://supabase.com/) project (for backend)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/starship-rental-dashboard.git
   cd starship-rental-dashboard
   ```

2. **Install dependencies:**
   ```sh
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase credentials and other settings.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SERVICE_ROLE=

# JWT Configuration
SECRET_JWT_KEY=
JWT_EXPIRE_TIME=

# Redis Configuration
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Required variables:
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anonymous key
- `SERVICE_ROLE`: Supabase service role key for admin operations
- `SECRET_JWT_KEY`: Secret key for JWT token generation
- `JWT_EXPIRE_TIME`: JWT token expiration time (e.g., "24h", "7d")
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis authentication token

> **Note**: Never commit your `.env` file to version control. Make sure it's listed in your `.gitignore` file.

---

## Development

Start the development server:

```sh
pnpm dev
# or
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

---

## Building for Production

```sh
pnpm build
# or
npm run build
```

Preview the production build:

```sh
pnpm preview
# or
npm run preview
```

---

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com) with server-side rendering enabled.

### Deploying to Vercel

1. **Push your code to GitHub**

2. **Import your repository in Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Select your repository
   - Vercel will automatically detect Astro configuration

3. **Configure environment variables:**
   - Add all required environment variables in your Vercel project settings
   - Ensure all variables from your `.env` file are properly set

4. **Deploy settings:**
   - Framework Preset: Astro
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `dist`
   - Install Command: `pnpm install` (or `npm install`)

> **Note**: The project uses `@astrojs/vercel/serverless` adapter in production mode, which is automatically configured in `astro.config.mjs`.

---

## Contributing

Contributions are welcome! Please open issues and pull requests for bug fixes, features, or improvements.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---