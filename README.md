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

## Lead capture & admin panel

A first-time visitor landing on the home page is redirected to `/welcome`, a
short gate page that asks for a phone number and an email address before they
browse the site. The pair is stored in Supabase, and the `/admin` panel lists
those leads and exports them as CSV.

- Submitting records the lead and sends the visitor on to the home page.
- **Skip for now** just sends them on; it is remembered for the browser session
  only, so a new session is asked again.
- The choice lives in the `vb-lead-gate` cookie. Crawlers and link-preview bots
  are passed straight through to the home page so search results are unaffected.
- `/?gate=off` bypasses the gate for browsers that refuse cookies.

### 1. Create the `leads` table

The project is initialised with the Supabase CLI (`supabase/migrations/`). In
the Supabase dashboard open **SQL Editor** and paste the contents of the most
recent file in `supabase/migrations/`, or link the project and run
`supabase db push`. The migration is idempotent.

Until it has run, a submission shows an error on the form (the API answers
`503` with `error: "table-missing"`) — visitors can still skip the gate.

### 2. Environment variables

Already present in your local `.env` — copy them into your host's environment
settings for production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server only, never shipped to the browser |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The single admin login |
| `ADMIN_SESSION_SECRET` | HMAC secret for the 7-day session cookie (32+ chars) |

### 3. Admin sign-in

Visit [`/admin/login`](http://localhost:3000/admin/login). Every `/admin` URL
is redirected there by `proxy.ts`, and each API route re-checks the session
cookie itself rather than trusting the proxy.

- Failed sign-ins are rate-limited to five attempts per minute per IP.
- Sessions are signed HMAC tokens in an http-only cookie; rotating
  `ADMIN_SESSION_SECRET` signs everyone out.
- Credentials are compared with constant-time digests, and no error message
  reveals whether an address exists.

### 4. CSV export

From the dashboard: **Phone numbers**, **Email addresses**, or **Everything**
(phone, email, date, time). Files are UTF-8 with a BOM and CRLF line endings,
phone numbers are quoted as text so Excel keeps a leading `+` or zeroes, and
times are rendered in `Asia/Kolkata` regardless of where the server runs.

### 5. Rate limits & validation

`POST /api/leads` allows five submissions per minute per IP. Numbers are
stripped of spaces/dashes/parens and must contain 8–15 digits (no country-code
guessing — `00` is normalised to `+`, everything else is kept as typed);
emails are lowercased. The `(phone, email)` pair is unique, so re-submitting
the same details twice stores one row.

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
| `components/site/LeadGateForm.tsx` | Lead form (client component, used by the gate) |
| `lib/lead-gate.ts` | Gate cookie name/values shared by proxy and form |
| `app/welcome/page.tsx` | Welcome gate — first page a new visitor sees |
| `lib/leads.ts` | Phone/email normalisation, insert and list of `public.leads` |
| `proxy.ts` | Sends first-time visitors to `/welcome`; guards `/admin` |
| `lib/admin/*` | Session signing, credential checks, route guard, CSV writer |
| `app/admin/*` | Admin pages (server components) + `components/admin/*` (client) |
| `app/api/leads/route.ts` | Public `POST` endpoint the gate form submits to |
| `app/api/admin/*/route.ts` | Sign-in, sign-out, list leads, CSV export |

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
