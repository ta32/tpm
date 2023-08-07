import Head from 'next/head';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import { UserProvider } from '../contexts/user'
import { PasswordEntriesProvider} from '../contexts/password_entries'
import { TagEntriesProvider } from '../contexts/tag_entries'
export default function MyApp({ Component, pageProps }: AppProps) {
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
      <UserProvider>
        <TagEntriesProvider>
          <PasswordEntriesProvider>
            <Component {...pageProps} />
          </PasswordEntriesProvider>
        </TagEntriesProvider>
      </UserProvider>
    </>
  )
}
