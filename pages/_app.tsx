import Head from 'next/head';
import 'styles/globals.css';
import { AppProps } from 'next/app';
import { UserProvider } from 'contexts/user.context';
import { PasswordEntriesProvider } from 'contexts/password-entries.context';
import { TagEntriesProvider } from 'contexts/tag-entries.context';
import { useEffect } from 'react';

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

export default function MyApp({ Component, pageProps }: AppProps) {
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
    <>
      <Head>
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
      </Head>
      <DependenciesContext.Provider value={defaultDeps}>
        <LocationProvider>
          <UserProvider>
            <TagEntriesProvider>
              <PasswordEntriesProvider>
                <Component {...pageProps} />
              </PasswordEntriesProvider>
            </TagEntriesProvider>
          </UserProvider>
        </LocationProvider>
      </DependenciesContext.Provider>
    </>
  );
}
