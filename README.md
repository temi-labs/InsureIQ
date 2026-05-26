# InsureIQ - Full-Stack Insurtech Dashboard

InsureIQ is a modern, responsive, and fully-featured React + TypeScript + Express dashboard designed for insurance companies, SaaS platforms, or related financial tracking applications.

This project was initially completely frontend-driven but has been successfully migrated to a full-stack architecture using a Node.js/Express backend with a file-based JSON database (`db.json`) for persistence.

## Features

- **Modern Dashboard**: Visually appealing UI with clean cards, typography, and charts (Recharts).
- **Authentication**: Working Auth context integrated with a Node REST API.
- **Form Management**: Pre-built forms for Policies, Claims, and user profiles.
- **Activity & Notifications**: Centralized notifications and activity logs for users powered by the backend.
- **Data Export**: Built-in CSV export features.
- **Responsive Layout**: Designed mobile-first utilizing Tailwind CSS.
- **RESTful API Backend**: Fully functional Express server handling CRUD operations for users, policies, claims, activities, and notifications.

## Tech Stack

- **Frontend**: React 18+ (Vite), TypeScript, Tailwind CSS, Lucide React, Recharts
- **Backend**: Node.js, Express
- **Database**: File-based `db.json` (easy to swap to Postgres/MongoDB)
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed on your machine.

### Installation

1. Copy the project files to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Edit `src/config.ts` to update the application name and basic feature toggles.

To customize the primary orange color (`#EC5E24`), search and replace all instances of `#EC5E24` and `#d4531e` in the `src` directory with your brand's hex codes, or update the `@theme` definitions in `src/index.css` and use standard Tailwind color classes.

### Running Development Server

Our setup uses a single process for both the Express backend and the Vite frontend middleware.

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

This ensures the frontend is bundled optimally and the Express server is compiled for production execution.

## File Structure

- `server.ts` - Express backend server and API endpoints
- `db.json` - Persistent storage for application data
- `src/components/` - Reusable UI components
- `src/contexts/` - React contexts for Auth and Notifications
- `src/pages/` - Core application pages
- `src/utils/` - Global utility functions

Happy building!
