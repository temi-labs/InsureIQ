# Architecture & Migration Thought Process

## 1. The Starting Point
The application began its lifecycle as a strictly frontend React application (Vite template). All state representations—Users, Policies, Claims, Activities, Notifications—were cached using browser `localStorage` and complex hooks.
This was excellent for immediate prototyping and UI/UX design refinement but unsuitable for a real-world SaaS model where data must be globally synchronized and securely validated.

## 2. The Objective
The core requirement was to migrate the application towards a **Full-Stack Application** pattern without losing existing frontend features. We wanted to drop `localStorage` persistence fully, except for minimal session management (`currentUser`), moving all logic into an API tier.

## 3. Why Express & `db.json`?
Instead of forcing a heavy database instance (like Postgres or Firebase setup) which introduces immense infrastructure configuration overhead, we opted for:
* **Express.js (Node.js)**: Standard routing framework directly integrating into our existing Node setup.
* **`db.json`**: Offers local file persistence using `fs.promises` locks. This is universally accessible, easy to mock, and allows users to hot-swap out the implementation details with a generic SQL/NoSQL driver when scaling.

## 4. Execution Step-by-Step

### Step A: Backend Foundation
- We integrated an Express instance directly into `server.ts`. 
- By utilizing Vite's middleware capabilities in non-production environments, we guaranteed we could run both the React SPA and the Node API simultaneously on a single port (`3000`), negating CORS issues and complex proxy arrangements.
- Helper functions `readDB()` and `writeDB()` were created to serialize interaction with `db.json`.

### Step B: Feature-by-Feature Migration
We executed the migration incrementally to prevent regression errors:
1. **Users Integration**: Built out GET and PUT endpoints (`/api/users`); updated our Admin & Profile pages to resolve name mappings from the backend.
2. **Core Entities (Policies & Claims)**: Built standard REST routes (`/api/policies`, `/api/claims`). Updated Dashboard and Analytics to rely on `Promise.all` patterns to fetch combined data from backend efficiently.
3. **Audit Trails (Activities & Notifications)**: Exchanged the synchronous `localStorage.setItem` for async network `POST` commands pointing at `/api/activities` and `/api/notifications`.
4. **Read-status updates**: Created specialty bulk-update routes like `PUT /api/notifications/read-all/:userId` to optimize database writes versus looping sequential requests.

### Step C: UI Adaptation & Cleanup
With endpoints live, we systematically searched for all residual `localStorage.getItem` patterns across the app and deleted the old initialization scripts (`seed.ts` and `migration.ts`).

## 5. Potential Future Additions & Enhancements
* **Authentication**: Currently, user authentication is managed simplistically using a frontend session state based on comparing passwords found in `/api/users`. Next steps should include JWT (JSON Web Tokens), `bcrypt` hashing on passwords, and server-side session cookies (`HttpOnly`) to ensure true authentication integrity.
* **Relational Databases (Postgres)**: For robust integrity, migrating the logic inside `server.ts` to utilize an ORM (like Prisma or Drizzle) paired with PostgreSQL will provide proper foreign key constraints between a User and their Claims.
* **Input Validation**: Use Zod or Joi middleware in Express to reject bad data structurally before it executes a disk write to `db.json`.
* **Testing**: Introduce Jest/Vitest unit testing for frontend components alongside Supertest libraries testing backend API response structures.
