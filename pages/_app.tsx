// pages/_app.tsx
import type { AppProps } from "next/app";
import "../styles/global.css"; // <-- ton ancien styles.css déplacé ici
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* pick the ones you added in /public */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#010B2E" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}