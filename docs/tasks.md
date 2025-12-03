# Vidly — Implementation Task Breakdown

## Phase 0: Project Setup & Infrastructure

- [ ] Configure Expo development build (EAS Build setup)
- [ ] Set up EAS credentials for iOS and Android
- [x] Create app icons and splash screen assets
- [x] Configure app.json with correct bundle identifiers
- [ ] Set up environment variables for API endpoints
- [ ] Initialize Git repository with proper .gitignore
- [x] Set up ESLint and Prettier with project conventions
- [x] Create folder structure for features (screens, components, hooks, services, stores)

---

## Phase 1: Core App Foundation

### Navigation Structure

- [x] Set up tab navigation with 3 tabs: Library, Downloads, Settings
- [x] Create stack navigator for video detail screen
- [x] Create modal navigator for download confirmation
- [x] Implement deep linking configuration for share extension callbacks

### Theme & Design System

- [x] Extend existing theme.ts with full color palette (backgrounds, surfaces, accents)
- [x] Create typography scale constants
- [x] Create spacing scale constants
- [x] Build reusable Button component (primary, secondary, ghost variants)
- [x] Build reusable Card component
- [x] Build reusable Input component
- [x] Build reusable ProgressBar component
- [x] Build reusable Toast/Snackbar component
- [x] Build reusable EmptyState component
- [x] Build reusable LoadingSpinner component

### State Management

- [x] Set up Zustand store for downloads state
- [x] Set up Zustand store for video library state
- [x] Set up Zustand store for app settings/preferences
- [x] Implement persistence layer (AsyncStorage or MMKV)

---

## Phase 2: Permissions & Onboarding

### Permissions Flow

- [x] Create permissions service to check and request all required permissions
- [x] Request notification permissions (expo-notifications)
- [x] Request photo library write permissions (expo-media-library)
- [x] Request photo library read permissions for displaying saved videos
- [x] Handle permission denied states with re-request UI
- [x] Create permission status indicators in settings

### Onboarding Screens

- [x] Design onboarding flow (3-4 screens max)
- [x] Build onboarding screen 1: Value proposition ("Download videos without leaving your app")
- [x] Build onboarding screen 2: Animated demo of Share Extension usage
- [x] Build onboarding screen 3: Permission requests with explanation
- [x] Build onboarding screen 4: "You're all set" confirmation
- [x] Implement onboarding completion flag in storage
- [x] Add skip option and progress indicators

---

## Phase 3: Video Download Engine

### URL Processing Service

- [x] Create URL validation utility (detect if string is valid URL)
- [x] Create platform detection utility (identify YouTube, TikTok, Instagram, etc.)
- [x] Build URL normalization (clean tracking params, expand shortened URLs)
- [x] Create supported platforms configuration with regex patterns

### Backend Integration (Video Extraction API)

- [x] Define API contract for video extraction endpoint
- [x] Build API client service with error handling
- [x] Implement request to extract video metadata (title, thumbnail, available qualities)
- [x] Implement request to get direct download URL
- [x] Add retry logic with exponential backoff
- [x] Add offline detection and appropriate error messaging

### Download Manager

- [x] Create download queue data structure
- [x] Implement single video download using expo-file-system
- [x] Implement download progress tracking with callbacks
- [x] Implement download pause functionality
- [x] Implement download resume functionality
- [x] Implement download cancellation
- [x] Handle download failures with retry option
- [x] Implement concurrent download limit (max 2-3 simultaneous)
- [x] Save downloaded video to app's documents directory
- [x] Generate and save video thumbnail locally
- [x] Update video library state on successful download
- [ ] Implement background download continuation (expo-task-manager)

### Notifications

- [x] Configure expo-notifications
- [x] Send notification when download starts
- [x] Send notification when download completes (with action to view)
- [x] Send notification when download fails (with action to retry)
- [x] Implement notification tap handlers (deep link to video)

---

## Phase 4: Share Extension (Primary Feature)

### iOS Share Extension

- [x] Create iOS Share Extension target in Xcode
- [x] Configure App Groups for data sharing between extension and main app
- [x] Build Share Extension UI in Swift (minimal: URL preview + Download button)
- [x] Implement URL extraction from share context
- [x] Write shared data to App Group container
- [x] Trigger main app background task to process download
- [x] Handle extension dismissal
- [x] Add Expo config plugin for Share Extension build integration

### Android Share Extension

- [x] Install and configure react-native-receive-sharing-intent
- [x] Register app as share target for URLs in AndroidManifest.xml
- [x] Handle incoming share intent on app launch
- [x] Build share receiver UI (modal overlay)
- [x] Process shared URL and initiate download
- [x] Implement deep link handling for share intents

### Share Extension UX

- [x] Show immediate feedback when share extension opens
- [x] Display loading state while fetching video metadata
- [x] Show video title and thumbnail preview
- [x] Show quality selection (if multiple available)
- [x] Display download button with clear CTA
- [x] Show success confirmation before dismissing
- [x] Handle errors gracefully with user-friendly messages

---

## Phase 5: Clipboard Detection

### Clipboard Service

- [ ] Install and configure expo-clipboard
- [ ] Create clipboard monitoring hook (useClipboardUrl)
- [ ] Implement URL detection from clipboard content
- [ ] Implement platform detection for clipboard URL
- [ ] Store last processed URL to avoid duplicate prompts
- [ ] Check clipboard on app foreground (AppState listener)

### Clipboard UI

- [ ] Build clipboard detection banner/modal
- [ ] Show video preview if metadata fetch succeeds
- [ ] Provide "Download" and "Dismiss" actions
- [ ] Add "Don't ask again for this URL" option
- [ ] Animate banner entrance/exit

---

## Phase 6: Video Library

### Library Screen

- [ ] Build library screen layout with grid view
- [ ] Implement video thumbnail grid with lazy loading
- [ ] Add pull-to-refresh functionality
- [ ] Build list view alternative with toggle
- [ ] Implement empty state with CTA to use share extension
- [ ] Add sorting options (date, name, size, platform)
- [ ] Add filtering by platform
- [ ] Implement search functionality

### Video Detail Screen

- [ ] Build video detail screen layout
- [ ] Display video metadata (title, duration, size, platform, date)
- [ ] Implement video playback using expo-av
- [ ] Add playback controls (play/pause, seek, fullscreen)
- [ ] Add share button (share video file)
- [ ] Add delete button with confirmation
- [ ] Add "Save to Photos" button (expo-media-library)
- [ ] Add "Open original URL" button

### Video Management

- [ ] Implement video deletion from library
- [ ] Implement bulk selection mode
- [ ] Implement bulk delete
- [ ] Implement storage usage display
- [ ] Add "Clear all downloads" option in settings

---

## Phase 7: Downloads Screen

### Active Downloads UI

- [ ] Build downloads screen layout
- [ ] Display list of active/queued downloads
- [ ] Show progress bar for each download
- [ ] Show download speed and ETA
- [ ] Add pause/resume button per download
- [ ] Add cancel button per download
- [ ] Implement download reordering (drag to prioritize)

### Download History

- [ ] Show recent completed downloads section
- [ ] Show failed downloads with retry option
- [ ] Add "Clear history" option

---

## Phase 8: Settings Screen

### Settings UI

- [ ] Build settings screen layout
- [ ] Add storage location preference (app storage vs. photo library)
- [ ] Add default quality preference
- [ ] Add WiFi-only download toggle
- [ ] Add notification preferences
- [ ] Add clipboard detection toggle (enable/disable)
- [ ] Display app version and build number
- [ ] Add "Rate App" link
- [ ] Add "Send Feedback" option
- [ ] Add "Privacy Policy" link
- [ ] Add "Terms of Service" link

### Storage Management

- [ ] Display total storage used by downloads
- [ ] Display available device storage
- [ ] Add "Clear cache" option
- [ ] Add "Delete all videos" option with confirmation

---

## Phase 9: Android Widget (P1)

- [ ] Install and configure react-native-android-widget
- [ ] Design widget layouts (small: 2x2, medium: 4x2)
- [ ] Build small widget: Quick paste button + storage indicator
- [ ] Build medium widget: Recent downloads grid + paste button
- [ ] Implement widget click handlers (open app, trigger paste flow)
- [ ] Register widget in AndroidManifest.xml
- [ ] Add widget update logic when downloads complete

---

## Phase 10: Backend Service (Video Extraction API)

- [ ] Choose hosting platform (Vercel/Railway/self-hosted)
- [ ] Set up Node.js/Python backend project
- [ ] Integrate yt-dlp or similar extraction library
- [ ] Build POST /extract endpoint (accepts URL, returns metadata)
- [ ] Build GET /download endpoint (accepts URL, returns direct video URL)
- [ ] Implement caching layer for repeated requests
- [ ] Add rate limiting per client
- [ ] Add error handling and logging
- [ ] Deploy and configure environment
- [ ] Add health check endpoint

---

## Phase 11: Polish & Edge Cases

### Error Handling

- [ ] Handle network errors gracefully
- [ ] Handle unsupported URL errors
- [ ] Handle extraction failures (platform blocked, video removed)
- [ ] Handle storage full scenarios
- [ ] Handle permission denied after initial grant
- [ ] Implement global error boundary

### Performance

- [ ] Optimize thumbnail loading (caching, lazy load)
- [ ] Optimize video list rendering (virtualization)
- [ ] Minimize re-renders in download progress updates
- [ ] Profile and optimize memory usage

### Accessibility

- [ ] Add accessibility labels to all interactive elements
- [ ] Ensure proper contrast ratios
- [ ] Support dynamic type / font scaling
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)

### Edge Cases

- [ ] Handle app killed during download (resume on reopen)
- [ ] Handle duplicate downloads (same URL)
- [ ] Handle very long video titles (truncation)
- [ ] Handle videos with no title
- [ ] Handle expired download URLs (re-fetch)

---

## Phase 12: Testing

### Unit Tests

- [ ] Test URL validation utility
- [ ] Test platform detection utility
- [ ] Test download manager queue logic
- [ ] Test state management stores

### Integration Tests

- [ ] Test end-to-end download flow
- [ ] Test share extension flow
- [ ] Test clipboard detection flow
- [ ] Test video playback

### Manual Testing Checklist

- [ ] Test on iOS device (real device required for share extension)
- [ ] Test on Android device
- [ ] Test all supported platforms (YouTube, TikTok, Instagram, Twitter)
- [ ] Test offline behavior
- [ ] Test background download
- [ ] Test notification actions
- [ ] Test low storage scenario
- [ ] Test permission denial flows

---

## Phase 13: Release Preparation

### App Store Assets

- [ ] Create App Store screenshots (6.5" and 5.5" iPhone)
- [ ] Create Play Store screenshots
- [ ] Write App Store description
- [ ] Write Play Store description
- [ ] Create app preview video (optional)
- [ ] Prepare privacy policy page
- [ ] Prepare terms of service page

### Build & Deploy

- [ ] Configure EAS production build profile
- [ ] Build iOS production IPA
- [ ] Build Android production AAB
- [ ] Submit to App Store Connect
- [ ] Submit to Google Play Console
- [ ] Prepare for app review (test accounts if needed)
- [ ] Plan phased rollout strategy

---

## Future Phases (Post-MVP)

### P1 Features

- [ ] Quality selection before download
- [ ] Audio-only extraction (MP3)
- [ ] Download queue management
- [ ] Folder organization
- [ ] Search and filter in library

### P2 Features

- [ ] iOS home screen widget
- [ ] Batch playlist download
- [ ] Cloud backup integration
- [ ] Video trimming
- [ ] Scheduled downloads
