# BillWise

Run `npm ci` and `npm run dev` for development. Use `npm run build` and
`npm run preview` to test the production service worker. Vercel serves the
generated `dist/` directory over HTTPS.

The install page lives at `/`. The planner uses `/#overview`, `/#bills`, and
`/#schedule`. The web and installed apps enter through `/#app`. Opening the
planner requires a verified Supabase session. Local edits work offline while
the verified session remains valid. Session verification or renewal may need a connection.

### Connect account sign-in

Signed-out visitors go to `/#login`. Choose **Create an account** for `/#signup`.
Each account has its own plan in this browser. The terms at `/#terms` and privacy
policy at `/#privacy` are readable before signing in and from the account page.

1. Open your Supabase project. From **Connect**, copy the project URL and
   publishable key. Copy `.env.example` to `.env.local` beside `package.json`.
   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to those values.
2. In Supabase **Authentication → Sign In / Providers**, enable **Email** and
   allow new users to sign up. If email confirmation is enabled, open the
   confirmation link in the browser where you signed up.
3. Open the **Google** provider and copy its **Callback URL**. In Google Cloud
   **Google Auth Platform → Clients**, select your existing web client, add
   that exact URL under **Authorized redirect URIs**, and save. It usually looks
   like `https://<project-ref>.supabase.co/auth/v1/callback`. Enable Google
   in Supabase, enter the Google client ID and secret there, and save.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to
   the BillWise origin. Under **Redirect URLs**, add
   `http://localhost:5173/?auth=callback` for development and
   `https://<your-app-host>/?auth=callback` for production.
5. Restart Vite, open `/#login`, and test **Continue with Google** or email
   signup. For Vercel, set both public build variables there and redeploy.

### Publish the Android download

Place the signed release at `public/downloads/BillWise.apk` and rebuild.
For a different filename in that directory, set the Vercel build environment
variable `BILLSORT_APK_FILENAME` to its basename and redeploy. The build
enables the link only when the file exists. Downloads are named `BillWise.apk`.
