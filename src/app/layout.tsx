'use client';
import React from 'react';
import 'styles/globals.css';
import { Inter } from 'next/font/google';
import { UserProvider } from 'contexts/user.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { useEffect } from 'react';

import { initTrezor, trezorDispose } from 'lib/trezor';
import { LocationProvider } from 'contexts/location.context';
import { defaultDeps, DependenciesContext } from 'contexts/deps.context';
import { APP_URL, TRUSTED_HOSTS } from 'lib/constants';

const TREZOR_CONNECT_CONFIG = {
  init: false,
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
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
      trezorDispose();
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
        <meta name="theme-color" content="#317EFB" />
      </head>
      <body>
        <DependenciesContext.Provider value={defaultDeps}>
          <LocationProvider>
            <UserProvider>
              <TagEntriesProvider>
                <PasswordEntriesProvider>{children}</PasswordEntriesProvider>
              </TagEntriesProvider>
            </UserProvider>
          </LocationProvider>
        </DependenciesContext.Provider>
      </body>
    </html>
  );
}
