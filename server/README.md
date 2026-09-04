# AetherCloud Server

The AetherCloud server is an Express and Prisma API for authenticated cloud file storage. It handles sessions, file metadata and binary data, folders, favorites, search, sharing, public links, and trash recovery.

## Stack

- Node.js and Express 5
- Prisma ORM 5 with PostgreSQL
- Express sessions with HTTP-only cookies
- Multer for multipart uploads
- Zod request validation
- Helmet, CORS, compression, and Morgan

## Run Locally

```bash
npm install
npm start
```

The API listens on `http://localhost:10000` by default. Use `npm run dev` if the server package defines a development script.

## Environment

Create `server/.env` with:

```env
PORT=10000
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=replace-with-a-long-random-secret
MAX_FILE_SIZE=104857600
TRASH_RETENTION_DAYS=30
STORAGE_QUOTA_BYTES=107374182400
```

Supabase storage variables are optional when binary file data is stored directly in PostgreSQL.

## Database

```bash
npx prisma db push
npx prisma generate
```

## API Areas

- `/api/auth` authentication and profile sessions
- `/api/files` upload, download, rename, move, favorite, and delete
- `/api/folders` folder management for API clients that need hierarchy
- `/api/search` authenticated search and shared-with-me results
- `/api/shares` user permissions and public links
- `/api/trash` restore, empty, and permanent deletion
- `/health` service health check

The API uses authenticated cookies for protected routes. The client must use `withCredentials: true` and the server must allow the configured client origin.

## Storage Accounting

`GET /api/files/storage` calculates usage from active, non-deleted file records. The quota is read from `STORAGE_QUOTA_BYTES`; the default is 100 GiB. Deleted files are excluded from the active usage total.

## Request Examples

```text
POST  /api/files/upload       multipart form field: file
GET   /api/files?search=report
PATCH /api/files/:id/favorite
POST  /api/shares/user         Viewer or Editor access
POST  /api/shares/link         expiry and optional password
GET   /api/trash
```

## Security Notes

- Session cookies are HTTP-only and protected by CORS origin checks.
- Password-protected public links store bcrypt hashes, never plaintext passwords.
- Public-link access validates expiry before returning file metadata or binary data.
- File binary data is excluded from metadata responses.
- Production deployments should use a strong `SESSION_SECRET`, HTTPS, and a managed session store.

## Tests

```bash
node --test tests/comprehensive.test.js tests/upload-download.test.js
```
