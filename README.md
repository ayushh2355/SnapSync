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
- Download photos with a watermark based on your role
- Share entire albums via QR code

**For photographers and admins:**
- Create and manage events/albums
- Upload photos in bulk — AI auto-tags them (people, objects, mood)
- Approve or reject role upgrade requests from members
- Full control over who can see what (public vs private photos)

**Under the hood:**
- Face descriptors are computed in the browser using face-api.js — nothing biometric leaves the device unencrypted
- Background worker (BullMQ + Redis) handles AI processing so uploads are instant
- Gemini Vision generates searchable tags for every photo automatically
- Real-time notifications via Server-Sent Events when someone likes or comments on your photo

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB + Mongoose |
| Auth | JWT (stored as httpOnly cookies) |
| Storage | Cloudinary |
| AI Tagging | Google Gemini Vision |
| Face Recognition | face-api.js (vladmandic) |
| Background Jobs | BullMQ + Redis (Upstash) |
| Notifications | Server-Sent Events (SSE) |
| Deployment | Vercel (app) + Render (worker) |

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
│  face-api.js runs here for selfie descriptor extraction      │
│  (face data never sent raw — only the 128-float vector)      │
└───────────────────┬──────────────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼──────────────────────────────────────────┐
│                   Vercel (Next.js API Routes)                 │
│                                                              │
│  /api/auth          → login, register, google oauth          │
│  /api/events        → CRUD events                            │
│  /api/media/upload  → validate, store to Cloudinary,         │
│                        push job to Redis queue               │
│  /api/media/search  → search by tag, uploader, event         │
│  /api/social/*      → likes, comments, favourites            │
│  /api/notifications → SSE stream + REST endpoints            │
│  /api/user/selfie   → store face descriptor, run retro-match │
└────────┬──────────────────────────────┬──────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────┐            ┌──────────────────────┐
│  MongoDB Atlas │            │   Upstash Redis       │
│                │            │   (BullMQ Queue)      │
│  All app data  │            └──────────┬────────────┘
└────────────────┘                       │ job picked up
                              ┌──────────▼────────────┐
                              │   Render.com Worker    │
                              │                        │
                              │  1. Download from      │
                              │     Cloudinary         │
                              │  2. Gemini → AI tags   │
                              │  3. face-api → detect  │
                              │     faces in photo     │
                              │  4. Match descriptors  │
                              │     against UserRef DB │
                              │  5. Send notifications │
                              └────────────────────────┘
```

---



## How Face Recognition Works

1. User uploads a selfie from the profile page
2. face-api.js runs **in the browser** and extracts a 128-dimensional face descriptor (just an array of floats — no raw image is used for matching)
3. This descriptor is sent to the server and stored in `UserReference`
4. When a new photo is uploaded, the background worker detects all faces in it and stores their descriptors on the `Media` record
5. The system computes euclidean distance between the stored descriptors — if distance < 0.6, it's a match
6. Matched users get auto-tagged and notified
7. Photos appear in "Photos You Appear In" on the profile page

This approach means face matching is entirely math — no image is ever compared to another image directly.

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
REDIS_URL=redis://127.0.0.1:6379
```

Start the app:
```bash
npm run dev
```

Start the background worker (separate terminal):
```bash
npm run worker
```

The worker is required for AI tagging and face recognition to process uploaded photos.

---

## Deployment

- **App** → Vercel (auto-deploys from `main` branch)
- **Worker** → Render.com (Background Worker service, `npm run worker:prod`)
- **Redis** → Upstash (free tier, Mumbai region)
- **Database** → MongoDB Atlas
- **Storage** → Cloudinary

Add `REDIS_URL` from Upstash to both Vercel and Render environment variables so they connect to the same queue.

---

## Team

Built by **Ayush Patel** for the CIG Open Projects 2026.