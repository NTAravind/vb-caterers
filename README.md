# VB Caterers — Next.js site

Brand site for VB Caterers (Bengaluru), built with Next.js (App Router) and
Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
```

Optional: copy `.env.example` to `.env.local` and fill in the Google Drive
gallery variables (see below) if you want the `/gallery` page to load media.

```bash
npm run lint     # ESLint
npm run build    # production build
npm run start    # serve the production build
```

## Google Drive media gallery

The gallery has two pages:

- `/gallery` — photos from the **photos** folder (masonry grid + lightbox)
- `/gallery/videos` — videos from the **videos** folder (video grid + player)

Both pages share one Drive service account and one cached listing; visitors
never land on Google Drive and the Google branding stays out of the media
viewing experience.

### 1. Create a Google Cloud project and service account

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a
   project (or pick an existing one).
2. Go to **APIs & Services → Library**, search for **Google Drive API** and
   click **Enable**.
3. Go to **IAM & Admin → Service Accounts → Create service account**.
   Give it any name (e.g. `vb-gallery`); no project roles are required.
4. Open the new service account → **Keys → Add key → Create new key → JSON**.
   Download the JSON file — it contains `client_email` and `private_key`.

### 2. Create and share the two Drive folders

1. In Google Drive, create (or pick) **two** folders — one for photos, one for
   videos. Keeping them separate is what makes `/gallery` and
   `/gallery/videos` show the right media.
2. **Share** each folder with the service account's `client_email`
   (`...@....iam.gserviceaccount.com`) as **Viewer**.
   *Optional:* also share the video folder as **Anyone with the link → Viewer**.
   This is not required for playback (videos are streamed through the server),
   but it makes the embedded fallback player available for codecs the browser
   cannot play, and lets Drive serve its own thumbnails sooner.

### 3. Configure environment variables

Add these to `.env.local` (local development) and to your hosting provider's
environment settings (production):

| Variable | Where to find it |
| --- | --- |
| `GOOGLE_DRIVE_PHOTOS_FOLDER_ID` | The ID in the photos folder URL: `drive.google.com/drive/folders/<ID>` |
| `GOOGLE_DRIVE_VIDEOS_FOLDER_ID` | The ID of the videos folder (same URL format) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` in the JSON key |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` in the JSON key — keep the `\n` escapes and wrap the value in double quotes |

```env
GOOGLE_DRIVE_PHOTOS_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_DRIVE_VIDEOS_FOLDER_ID=1ZyXwVuTsRqPoNmLkJiHgFeDcBa
GOOGLE_SERVICE_ACCOUNT_EMAIL=vb-gallery@my-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

The two folder IDs are independent: set both, or only one if a site has just
photos (or just videos) — the other page then shows a setup notice. The
service-account pair is always required. If anything is missing a page renders a
setup notice instead of pretending to work. No credentials are ever sent to the
browser.

### 4. Adding media

Ask the client to upload photos into the photos folder and videos into the videos
folder (drag-and-drop in Google Drive — no website upload needed). New files
appear within about five minutes, sorted newest first. Sub-folders are ignored:
only files directly inside a configured folder are listed, and only the media
kind that folder is for — images are listed from the photos folder, videos from
the videos folder. Supported types: `jpeg, png, webp, gif, avif, bmp` and
`mp4, webm, ogg, quicktime/mov, m4v`.

## Architecture

| Path | Purpose |
| --- | --- |
| `lib/gallery/config.ts` | Env reading (two folders), page copy, size/caps constants |
| `lib/gallery/drive.ts` | Service-account JWT auth + paginated `files.list` per folder |
| `lib/gallery/media.ts` | `use cache`d merged listing shared by both pages and the media route |
| `lib/gallery/format.ts` | Pure helpers (MIME filtering, sorting, alt text) |
| `app/gallery/page.tsx` | Photos page (server component) |
| `app/gallery/videos/page.tsx` | Videos page (server component) |
| `components/gallery/GalleryPageShell.tsx` | Hero, album tabs and per-album content |
| `app/api/gallery/media/[fileId]/route.ts` | Allow-listed media proxy (thumbnails, resized previews, Range video streaming) |
| `components/gallery/*` | Photo masonry, video grid, lightbox, video player, states |

Drive metadata is cached with `use cache` / `cacheLife` (fresh within ~5
minutes, errors retried every ~30s). The media endpoint only serves file IDs
that exist in one of the configured folders, keeps a per-instance rate limit,
and streams video bytes through without buffering them in server memory.

Configuration is read on every request (never cached), so adding or changing
the environment variables — or fixing folder sharing — takes effect on the next
page load, without rebuilding or redeploying.

## Known limitations

- **Video codecs.** The custom HTML5 player is tried first; if the browser
  cannot play the file (e.g. `.mov`/HEVC or a storage endpoint that refuses
  partial content), the modal falls back to Google Drive's embedded viewer.
  Google controls that player's UI, and it only works when the video is shared
  for link playback.
- **Private thumbnails.** Thumbnails of folders shared only with the service
  account are generated server-side from the original image. For private
  videos without a usable thumbnail the grid shows a branded placeholder.
- **Large videos** are streamed from Drive with HTTP Range passthrough; they
  are never downloaded into memory, but very large files still depend on the
  visitor's connection and on Drive supporting partial downloads.
- **Pagination cap.** Up to 600 files are listed per refresh (configurable via
  `MAX_FILES` in `lib/gallery/config.ts`).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js deployment](https://nextjs.org/docs/app/building-your-application/deploying)
