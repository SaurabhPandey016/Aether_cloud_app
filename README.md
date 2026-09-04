# AetherCloud

AetherCloud is a full-stack cloud file workspace built for fast, secure file control. Upload files by picker or drag-and-drop, search and filter them, manage favorites, share with Viewer or Editor permissions, create expiring password-protected public links, and recover deleted files from Trash.

## Project Structure

```text
client/   Next.js dashboard and shared-file recipient experience
server/   Express API, Prisma data model, sessions, and storage services
```

## Quick Start

Start the API first:

```bash
cd server
npm install
npx prisma generate
npm start
```

In another terminal, start the dashboard:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`. The default API URL is configured through the client `NEXT_PUBLIC_API_URL` environment variable.

## Product Features

- Secure signup, login, logout, and profile session
- Drag-and-drop and picker-based multi-file uploads
- Download, rename, move, delete, and permanent deletion
- Live name search with file type, owner, and sort controls
- Starred files with quick actions
- Viewer and Editor user sharing with revoke controls
- Public links with expiry dates and optional passwords
- Recipient access page for shared files
- Trash restore and empty-trash workflows
- Responsive collapsible dashboard navigation

## Documentation

- [Client setup and workflows](client/README.md)
- [Server setup, environment, API, and tests](server/README.md)

## Architecture

The browser client communicates with the Express API over authenticated JSON and multipart requests. Express validates sessions and request payloads, Prisma persists metadata and sharing relationships in PostgreSQL, and file bytes are stored in PostgreSQL with optional Supabase storage support. Active storage usage is calculated from non-deleted file records.

## Quality Checks

```bash
cd client && npm run build && npm run lint
cd ../server && node --test tests/comprehensive.test.js tests/upload-download.test.js
```

## Configuration Checklist

- Set `client/.env.local` with `NEXT_PUBLIC_API_URL`.
- Set database, session, client-origin, and quota values in `server/.env`.
- Run `npx prisma generate` after schema changes.
- Use HTTPS and a persistent session store in production.

## Contact

Built and maintained by Saurabh Pandey.

- Email: developersaurabh001@gmail.com
- Contact: +91 87200 26790
- GitHub: https://github.com/SaurabhPandey016
- LinkedIn: https://www.linkedin.com/in/saurabhpandey-/

Made with love by Saurabh Pandey.
