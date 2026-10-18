# Hasim Apk — Professional APK download website

A responsive dark-and-gold Android app library using your supplied VIP logo. Visitors can search published apps and download APKs. Uploads require a private admin key.

## Requirements
- Node.js 18 or newer
- A host that supports a persistent disk and Node.js apps (APK files and `apps.json` are stored on disk)

## Run locally
1. Install Node.js.
2. Extract this ZIP and open a terminal in the project folder.
3. Run `npm install`.
4. Set the upload admin key:
   - Linux/macOS: `export ADMIN_KEY='use-a-long-random-secret-here'`
   - Windows PowerShell: `$env:ADMIN_KEY='use-a-long-random-secret-here'`
5. Optional: `export MAX_APK_MB=250` (or set the equivalent environment variable).
6. Run `npm start`.
7. Open `http://localhost:3000`.

## Publish it publicly
Deploy the project folder to a Node.js hosting provider that supports persistent file storage. Set `ADMIN_KEY` in the provider's environment-variable settings to a long random secret. Set `MAX_APK_MB` if desired. Then use the public HTTPS domain the provider gives you.

**Important:** do not publish `.env`, share your admin key, or allow public write access. This project protects publishing with an admin key and only accepts files ending in `.apk`, but that extension check does not prove an APK is safe. Only publish apps you trust, scan files before uploading, and include clear app/version information. A server with ephemeral storage may lose uploads when it restarts; use persistent storage or adapt the app to object storage for production.

## What is included
- Responsive homepage and app search
- Your supplied logo as favicon and site branding
- APK upload form protected by server-side admin key
- Public APK download links
- App metadata stored in `apps.json`
- Basic upload size limit and filename randomization

## Production notes
For a larger public service, use managed object storage, a database, rate limiting, malware scanning, backups, and an admin login system instead of relying on a shared secret. This starter is a functional deployable website project, but it is not automatically hosted online by creating the ZIP.
