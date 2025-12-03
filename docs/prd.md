# Vidly — Product Requirements Document

## Problem Statement

When users encounter a video they want to save locally, the current workflow is:

1. Copy the video URL
2. Leave the current app (browser, social media, etc.)
3. Navigate to a third-party download site (e.g., savefrom.net)
4. Paste the URL
5. Wait for processing
6. Download the video
7. Return to the original app

This multi-step, context-switching process is **friction-heavy** and breaks the user's flow. The core problem: **users must leave their current app to download a video**.

---

## Solution

**Vidly** is a mobile app that enables users to download videos **without leaving their current app**. The primary mechanism is a **Share Extension** — users tap the native share button in any app (browser, Instagram, TikTok, Twitter, etc.), select Vidly, and the download happens in the background. No app switching required.

### Core Value Proposition

> "Download any video in 2 taps. Never leave your app."

---

## User Personas

### Primary: Casual Content Consumer

- Frequently browses social media and video platforms
- Wants to save videos for offline viewing or sharing
- Frustrated by the current multi-step download process
- Values speed and simplicity over advanced features

### Secondary: Content Curator

- Collects videos for later reference or creative projects
- Needs organized storage and easy retrieval
- Downloads multiple videos in sessions
- Values library management features

---

## User Flows

### Flow 1: Share Extension Download (Primary — No Context Switch)

```
User watching video in any app
        ↓
Taps native Share button
        ↓
Selects "Vidly" from share sheet
        ↓
Vidly Share Extension appears as overlay/sheet
        ↓
Shows video preview + "Download" button
        ↓
User taps Download
        ↓
Toast confirmation: "Downloading..."
        ↓
Share sheet dismisses — user stays in original app
        ↓
System notification when complete: "Video saved!"
```

**Key principle:** User never leaves their current app. The share extension is an overlay, not a full app switch.

### Flow 2: Clipboard Detection on App Open (Secondary)

```
User copies a video URL (anywhere)
        ↓
User opens Vidly app (manually or from widget)
        ↓
App detects URL in clipboard
        ↓
Prompt appears: "Download video from [URL]?"
        ↓
User confirms → Download begins
```

### Flow 3: Manual URL Entry (Fallback)

```
User opens Vidly app
        ↓
Taps "Paste URL" or enters URL manually
        ↓
App fetches video metadata
        ↓
User selects quality/format
        ↓
Download begins
```

### Flow 4: Library Management

```
User opens Vidly app
        ↓
Views downloaded videos in grid/list
        ↓
Can: Play, Share, Delete, Organize
        ↓
Videos are saved to device and accessible offline
```

---

## Features

### P0 — Must Have (MVP)

| Feature                   | Description                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Share Extension**       | Native iOS/Android share sheet integration. User shares URL from any app → Vidly processes and downloads in background. No app switch required. |
| **Video Download Engine** | Extract and download videos from URLs. Support major platforms (YouTube, TikTok, Instagram, Twitter/X, Facebook, Vimeo).                        |
| **Download Progress**     | Real-time progress indicator. Background download continues even when share sheet closes.                                                       |
| **System Notifications**  | Notify user when download completes or fails. Actionable: tap to view video.                                                                    |
| **Video Library**         | Grid view of downloaded videos with thumbnails. Basic playback. Delete functionality.                                                           |
| **Clipboard Detection**   | On app open, detect if clipboard contains a video URL and prompt to download.                                                                   |
| **Permissions Flow**      | Request necessary permissions: notifications, photo library access, local network (if needed).                                                  |
| **Onboarding**            | Brief tutorial showing how to use Share Extension (the primary flow).                                                                           |

### P1 — Should Have (v1.1)

| Feature                 | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **Quality Selection**   | Choose video quality/resolution before download.                   |
| **Audio-Only Mode**     | Extract and download audio only (MP3).                             |
| **Download Queue**      | Queue multiple downloads, manage order, pause/resume.              |
| **Android Widget**      | Home screen widget showing recent downloads or quick-paste button. |
| **Folder Organization** | Create folders/collections to organize videos.                     |
| **Search & Filter**     | Search downloaded videos by title, source, date.                   |

### P2 — Nice to Have (v2+)

| Feature            | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| **iOS Widget**     | Home screen widget (requires native Swift implementation). |
| **Batch Download** | Download multiple videos from a playlist URL.              |
| **Cloud Backup**   | Optional sync to iCloud/Google Drive.                      |
| **Video Trimming** | Basic edit: trim start/end before saving.                  |
| **Scheduling**     | Schedule downloads for off-peak hours (WiFi only).         |

---

## Technical Architecture

### Tech Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Framework        | Expo SDK 54 + React Native 0.81                        |
| Language         | TypeScript (strict mode)                               |
| Navigation       | expo-router v6 (file-based)                            |
| State Management | Zustand or React Context                               |
| Styling          | StyleSheet + theme tokens (existing pattern)           |
| File System      | expo-file-system                                       |
| Media Library    | expo-media-library                                     |
| Clipboard        | expo-clipboard                                         |
| Notifications    | expo-notifications                                     |
| Background Tasks | expo-task-manager                                      |
| Share Extension  | react-native-share-menu (Android) + native Swift (iOS) |

### Share Extension Architecture

#### iOS

- Native Swift Share Extension target
- Uses App Groups to share data with main app
- Communicates download request to main app via shared container
- Main app handles actual download (background task)

#### Android

- `react-native-share-menu` or `react-native-receive-sharing-intent`
- Can be handled more directly in React Native
- Uses Android's native share intent system

### Video Extraction

The app needs to extract direct video URLs from platform pages. Options:

1. **Server-side extraction** (Recommended for MVP)

   - Backend service handles URL parsing and video extraction
   - Pros: Easier to update extractors, handles platform changes, reduces app size
   - Cons: Requires server infrastructure, ongoing maintenance

2. **Client-side extraction**
   - Embed extraction logic in app (e.g., youtube-dl port)
   - Pros: No server dependency, works offline
   - Cons: Larger app size, harder to update when platforms change

**Recommendation:** Start with server-side for flexibility. The backend can be a simple Node.js/Python service using yt-dlp or similar.

### Data Model

```typescript
interface Video {
  id: string;
  sourceUrl: string; // Original URL (e.g., youtube.com/watch?v=...)
  platform: Platform; // youtube | tiktok | instagram | twitter | etc.
  title: string;
  thumbnail: string; // Local path to thumbnail
  localPath: string; // Local path to video file
  duration: number; // Seconds
  resolution: string; // e.g., "1080p"
  fileSize: number; // Bytes
  downloadedAt: Date;
  status: DownloadStatus; // pending | downloading | completed | failed
  progress: number; // 0-100
}

type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "facebook"
  | "vimeo"
  | "other";
type DownloadStatus = "pending" | "downloading" | "completed" | "failed";
```

### File Storage

```
Documents/
├── videos/
│   ├── {id}.mp4
│   └── ...
├── thumbnails/
│   ├── {id}.jpg
│   └── ...
└── database.json (or SQLite)
```

---

## Platform Support

### Supported Video Platforms (MVP)

| Platform                 | Priority | Notes                           |
| ------------------------ | -------- | ------------------------------- |
| YouTube                  | P0       | Most requested                  |
| TikTok                   | P0       | High demand                     |
| Instagram (Reels, Posts) | P0       | Common use case                 |
| Twitter/X                | P0       | Video tweets                    |
| Facebook                 | P1       | Publicly accessible videos      |
| Vimeo                    | P1       | Common for professional content |

### Device Support

- iOS 15.1+
- Android API 23+ (Android 6.0)

---

## Constraints & Limitations

### Technical Constraints

1. **No background clipboard monitoring** — iOS and Android do not allow apps to continuously monitor the clipboard in the background. Detection only works when the app is foregrounded.

2. **No Control Center integration** — iOS does not provide a public API for adding items to Control Center.

3. **iOS Share Extension limitations** — Share Extensions have limited memory and execution time. Heavy processing must be delegated to the main app.

4. **Development builds required** — Share Extensions and widgets require a custom development build (not Expo Go).

### Legal Constraints

1. **Terms of Service** — Downloading videos may violate ToS of some platforms. App should include disclaimer.

2. **App Store policies** — Apple/Google may reject apps that enable downloading copyrighted content. Consider:
   - Emphasizing "personal use" and "offline viewing"
   - Not explicitly naming platforms in store listing
   - Adding content-source disclaimer

---

## Success Metrics

| Metric                              | Target (90 days post-launch)          |
| ----------------------------------- | ------------------------------------- |
| Share Extension usage rate          | 70%+ of downloads via share extension |
| Download success rate               | 95%+                                  |
| Average time to download initiation | < 3 seconds from share tap            |
| User retention (D7)                 | 40%+                                  |
| App Store rating                    | 4.5+ stars                            |

---

## Out of Scope (v1)

- Live stream recording
- Playlist batch download
- Video editing beyond basic trim
- Social features (sharing collections with others)
- Subscription/paywall (app is free)
- Ads

---

## Open Questions

1. **Backend hosting:** Where to host the video extraction service? (Vercel, Railway, self-hosted?)
2. **Monetization:** Free with optional tip jar? One-time purchase? Free with limits?
3. **Platform extraction updates:** How to handle when platforms change their video delivery? (Hot-update extraction logic via remote config?)

---

## Appendix: Share Extension User Education

Since the Share Extension is the primary (and most valuable) feature, onboarding must clearly teach users how to use it:

1. **Onboarding screen:** Animated demo showing share button → select Vidly → download
2. **First-run prompt:** "Tip: You can download videos directly from any app using the Share button!"
3. **Empty state:** Library empty state should reinforce the share extension flow
