'use client';
import React, { useEffect } from 'react';
import 'styles/globals.css';
import { Inter } from 'next/font/google';
import { UserProvider } from 'contexts/user.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { TagEntriesProvider } from 'contexts/tag-entries.context';

import { initTrezor, trezorDispose } from 'lib/trezor';
import { LocationProvider } from 'contexts/location.context';
import { defaultDeps, DependenciesContext } from 'contexts/deps.context';

const APP_URL = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  : 'http://localhost:3000/';
// Trezor bridge whitelists localhost and trezor.io domains
const TRUSTED_HOSTS = ['localhost', 'trezor.io'];
const TREZOR_CONNECT_CONFIG = {
  init: false,
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {

  useEffect(() => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) =>
        console.log(
          'Service Worker registration successful with scope: ',
          registration.scope
        )
      )
      .catch((err) => console.log('Service Worker registration failed: ', err))
  }, []);

  useEffect(() => {
    if (!TREZOR_CONNECT_CONFIG.init) {
      const trustedHost = TRUSTED_HOSTS.includes(window.location.hostname);
      initTrezor(APP_URL, trustedHost).catch((error) => {
        // FATAL ERROR
        console.error(error);
        return;
      });
    }
    TREZOR_CONNECT_CONFIG.init = true;
    // cleanup
    return () => {
      TREZOR_CONNECT_CONFIG.init = false;
      trezorDispose().catch((error) => {
        console.error(error);
        return;
      });
    };
  }, []);

  return (
    <html lang="en" className={inter.className}>
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=2,user-scalable=yes"
      />
      <meta name="description" content="Description" />
      <meta name="keywords" content="Keywords" />
      <title>Temporary Password Manager</title>

      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#317EFB" />
    </head>
    <body>
      <DependenciesContext.Provider value={defaultDeps}>
        <LocationProvider>
          <UserProvider>
            <TagEntriesProvider>
              <PasswordEntriesProvider>
                {children}
              </PasswordEntriesProvider>
            </TagEntriesProvider>
          </UserProvider>
        </LocationProvider>
      </DependenciesContext.Provider>
    </body>
    </html>
  )
}