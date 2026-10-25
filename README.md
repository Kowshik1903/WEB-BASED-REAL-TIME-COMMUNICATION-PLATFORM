# Chat Portal

A real-time MERN chat application with a responsive, modern chat interface.

## What is included

- JWT-protected authentication, real-time presence, typing indicators, unread counters, retryable optimistic sends, and light/dark/system themes.
- A rich composer: emoji picker, image picker, camera capture, GIF picker (including a secure GIF-link option), browser location sharing, and document attachments.
- Rich message cards for photos, GIFs, locations, and downloadable documents.
- Attachment safety limits: up to five attachments per message and 6 MB per attachment. Attachments are stored with the message in MongoDB, so use object storage for larger production media.

## Requirements

- Node.js 20 or newer
- A MongoDB database (Atlas or a local instance)

## Setup

1. In `BACKEND`, copy `.env.example` to `.env`, then enter your own MongoDB connection string and long JWT secret. Do not commit this file.
2. In `FRONTEND`, copy `.env.example` to `.env`. The default local backend URL is already filled in.
3. Open two terminals and run:

```bash
cd BACKEND
npm install
npm run dev
```

```bash
cd FRONTEND
npm install
npm run dev
```

4. Visit `http://localhost:5173`. Register two accounts in separate browser sessions to test real-time delivery.

## Production note

Camera and location features require a secure context (`https`) outside `localhost` and prompt the person using the browser for permission. The built-in GIF gallery is intentionally keyless; users can also paste any secure GIF URL. For production-scale uploads, swap the data-URL attachment flow for S3, Cloudinary, or another object store and persist only the returned URL.
