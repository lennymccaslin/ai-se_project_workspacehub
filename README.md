# WorkspaceHub

WorkspaceHub is a full-stack workspace for managing an organization's projects,
tasks, team activity, and bookings. Users sign in to an organization and work
with resources according to their role.

**Frontend:** [Open WorkspaceHub](https://ai-se-project-workspacehub-u7ff.vercel.app)

**API:** [Health check](https://ai-se-project-workspacehub-xi.vercel.app/api/health)

## Features

- Register an organization, sign in, and manage access using owner, admin, and
  member roles.
- View a dashboard with workspace counts and upcoming task deadlines.
- Create and manage projects and tasks, including task assignments, priorities,
  statuses, and due dates.
- View task comment counts, expand comments on demand, and add, edit, or delete
  comments. Authors and organization owners or admins can manage a comment;
  comments from deleted users display as "Unknown user."
- Schedule bookings with date validation and overlap checks.
- Manage organization settings and feature flags, including scheduling.

## Tech stack

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, Axios, and
  React Context.
- **Backend:** Node.js, Express, TypeScript, MongoDB, and Mongoose.
- **Authentication:** JWT and bcryptjs.
- **Tooling:** ESLint, Prettier, and Vitest.
- **Deployment:** Vercel; the frontend configuration supports React Router
  paths on refresh.

## Project structure

```text
client/   React frontend
server/   Express API
postman/  Comment API test collections
```

## Local setup

1. Install Node.js, npm, and MongoDB, then install dependencies from the
   repository root:

   ```bash
   npm install
   ```

2. Copy `server/.env.example` to `server/.env` and `client/.env.example` to
   `client/.env`. Configure these values:

   | Variable        | Workspace | Purpose                                                         |
   | --------------- | --------- | --------------------------------------------------------------- |
   | `PORT`          | Server    | API port; defaults to `5001`.                                   |
   | `MONGODB_URI`   | Server    | MongoDB connection string.                                      |
   | `JWT_SECRET`    | Server    | Secret used to sign and verify tokens.                          |
   | `CLIENT_ORIGIN` | Server    | Allowed frontend origin for CORS.                               |
   | `VITE_API_URL`  | Client    | API origin without `/api`; defaults to `http://localhost:5001`. |

   The example files contain local development values. Use a unique, strong
   `JWT_SECRET` and a production database connection string in deployment
   environment settings; never commit secrets.

3. Start MongoDB or configure a reachable instance. To populate demo data, run:

   ```bash
   npm run seed
   ```

   **Warning:** Seeding deletes existing bookings, comments, tasks, projects,
   users, and organizations in the database specified by `MONGODB_URI` before
   creating demo data. Do not run it against a database containing data you
   need to keep.

4. Start the API and frontend in separate terminals:

   ```bash
   npm run dev:server
   npm run dev:client
   ```

   The example configuration uses `http://localhost:5001` for the API and
   `http://localhost:5173` for the frontend.

## Demo accounts

After seeding, these accounts share the password `Password123!`:

| Email                           | Role   |
| ------------------------------- | ------ |
| `owner@workspacehub.dev`        | Owner  |
| `admin@workspacehub.dev`        | Admin  |
| `member@workspacehub.dev`       | Member |
| `other-member@workspacehub.dev` | Member |

These are demo credentials, not production accounts.

## Validation and API tests

Run these commands from the repository root:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test --workspace client
npm run build
```

The `postman/` directory contains Postman v2.1 collections for comment
permissions and API edge cases. Import and run a collection in order against a
seeded test database. The collections create and delete comments; the permissions
collection also registers a separate test organization, so use a disposable
database rather than production data.

## Deployment

Set the server's `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` in the
deployment environment. Set the frontend's `VITE_API_URL` to the deployed API
origin, without `/api`, and configure the frontend origin as the server's
`CLIENT_ORIGIN`. The API health endpoint is `/api/health`; it does not require
a database connection.
