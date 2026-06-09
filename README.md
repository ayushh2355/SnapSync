# SnapSync

**Live Demo → [the-snap-sync.vercel.app](https://the-snap-sync.vercel.app)**

SnapSync is a media management platform built for college clubs and societies. The idea came from a simple frustration — after every fest or event, photos end up scattered across 10 different WhatsApp groups, Google Drives, and personal phones. Half of them never get shared properly, and photographers never get credit for their work.

SnapSync fixes this. One link, all the photos, organized by event — with face recognition that automatically finds photos of you across every album.

---

## What It Does

**For members joining an event:**
- Browse albums from events they were part of
- Upload a selfie once — the system finds every photo where your face appears, across all events
- Like and comment on photos
- Share entire albums via QR code

**For photographers and admins:**
- Create and manage events/albums
- Upload photos in bulk — AI auto-tags them (people, objects, mood)
- Approve or reject role upgrade requests from members
- Full control over who can see what (public vs private photos)

**Under the hood:**
- **Zero-Server Processing:** Face descriptors are computed entirely in the browser using face-api.js before the photo is uploaded. This bypasses Vercel's 10-second timeout limits and keeps processing 100% free.
- **Direct-to-Cloud:** Images are uploaded straight from the user's browser to Cloudinary securely using cryptographic signatures, preventing the Vercel backend from being choked by large files.
- **Async AI:** Gemini Vision generates searchable tags asynchronously in the background using Next.js `after()`, so the user never has to wait for AI processing to finish.
- Real-time notifications via Server-Sent Events when someone likes or comments on your photo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB + Mongoose |
| Auth | JWT (stored as httpOnly cookies) |
| Storage | Cloudinary (Direct Upload via Browser) |
| AI Tagging | Google Gemini 2.5 Flash |
| Face Recognition | face-api.js (vladmandic) |
| Notifications | Server-Sent Events (SSE) |
| Deployment | Vercel |

---

## Database Schema

### User
```
_id, name, email, password (hashed), role, createdAt
role: "Admin" | "Photographer" | "Club Member" | "Viewer"
```

### Event
```
_id, name, description, category, date, createdBy, isPrivate, createdAt
```

### Media
```
_id, eventId, uploadedBy, fileUrl, s3Key, mimeType, fileType,
accessType, tags[], detectedUsers[], faceDescriptors[], hash, createdAt
```

### Like
```
_id, mediaId, userId, createdAt
```

### Comment
```
_id, mediaId, userId, text, createdAt
```

### Notification
```
_id, recipientId, actorId, type, mediaId, commentId, requestId, isRead, createdAt
type: "like" | "comment" | "tag" | "role_request" | "role_approved" | "role_rejected"
```

### UserReference (Face Recognition)
```
_id, userId, selfieUrl, selfieKey, faceDescriptor[] (128-float vector), createdAt
```

### RoleRequest
```
_id, userId, requestedRole, reason, status, createdAt
status: "pending" | "approved" | "rejected"
```

### Favourite
```
_id, mediaId, userId, createdAt
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                     │
│                                                              │
│  1. face-api.js runs here to extract face descriptors        │
│  2. Browser fetches upload signature from /api/media/sign    │
│  3. Browser uploads RAW image directly to Cloudinary         │
└───────────────────┬─────────────────────────┬────────────────┘
                    │ HTTPS                   │ HTTPS
┌───────────────────▼────────────────┐ ┌──────▼────────────────┐
│           Cloudinary               │ │    Vercel Backend     │
│                                    │ │                       │
│  Receives large image file         │ │  /api/media/save      │
│  Returns secure_url                │ │                       │
└────────────────────────────────────┘ │  1. Saves Cloudinary  │
                                       │     URL to MongoDB    │
                                       │  2. Euclidean distance│
                                       │     match for faces   │
                                       │  3. Runs Gemini AI    │
                                       │     asynchronously    │
                                       └────────┬──────────────┘
                                                │
                                                ▼
                                       ┌────────────────┐
                                       │  MongoDB Atlas │
                                       │                │
                                       │  All app data  │
                                       └────────────────┘
```

---

## How Face Recognition Works

1. User uploads a selfie from the profile page.
2. `face-api.js` runs **in the browser** and extracts a 128-dimensional face descriptor (just an array of floats — no raw image is used for matching).
3. This descriptor is sent to the server and stored in `UserReference`.
4. When a new photo is uploaded to an event album, the browser again detects all faces in it before uploading and sends those descriptors to the server.
5. The backend computes the euclidean distance between the stored descriptors — if distance < 0.6, it's a match.
6. Matched users get auto-tagged and notified.
7. Photos appear in "Photos You Appear In" on the profile page.

This approach means face matching is entirely math — no image is ever compared to another image directly on the backend.

---

## Running Locally

```bash
git clone https://github.com/ayushh2355/SnapSync.git
cd SnapSync
npm install
```

Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the app:
```bash
npm run dev
```

*Note: The background worker (Redis/BullMQ) is no longer required! Everything runs perfectly on Next.js.*

---

## Deployment

- **App + API + AI Processing** → Vercel (auto-deploys from `main` branch)
- **Database** → MongoDB Atlas
- **Storage** → Cloudinary

You no longer need Render or Upstash for this architecture. Everything runs natively and asynchronously within Vercel's serverless environment.

---

## Team

Built by **Ayush Patel** for the CIG Open Projects 2026.