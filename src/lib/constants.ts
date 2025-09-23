export const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  : process.env.NEXT_PUBLIC_ORIGIN || 'https://tauri.localhost/';

// Trezor bridge whitelists localhost and trezor.io domains
export const TRUSTED_HOSTS = ['localhost', 'trezor.io', 'tauri.localhost'];

// Dropbox SDK OAUTH2 Client ID
// App key from dropbox app console. Cannot be assumed to be secret since it must be stored in the client
export const DROPBOX_CLIENT_ID = process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID;
