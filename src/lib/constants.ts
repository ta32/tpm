export const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  : process.env.NEXT_PUBLIC_ORIGIN || 'https://tauri.localhost/';

// Trezor bridge whitelists localhost and trezor.io domains
export const TRUSTED_HOSTS = ['localhost', 'trezor.io', 'tauri.localhost'];
