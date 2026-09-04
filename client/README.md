# AetherCloud Client

The AetherCloud client is a polished Next.js dashboard for secure file storage. It provides drag-and-drop uploads, search and filtering, file actions, favorites, sharing, trash recovery, and public-link access.

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4 and shadcn-compatible UI primitives
- Zustand for client state
- Axios for authenticated API requests
- Native drag-and-drop upload support

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Configure `NEXT_PUBLIC_API_URL` in `.env.local` to point to the API, for example `http://localhost:10000/api`.

## Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

## Main Workflows

- Upload files with the picker or drag-and-drop zone.
- Search by name and refine results by file type, owner, and sort order.
- Download, rename, move, star, share, and delete files.
- Manage Viewer/Editor access and public links with expiry and optional passwords.
- Restore deleted files from Trash or permanently remove them.

The dashboard expects the AetherCloud server to be running locally or at the URL configured in `NEXT_PUBLIC_API_URL`.
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
