// pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/global.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Favicon(s) – place les fichiers dans /public */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#010B2E" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
