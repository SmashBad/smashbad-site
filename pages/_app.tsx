// pages/_app.tsx
import type { AppProps } from "next/app";
import "../styles/global.css"; // <-- ton ancien styles.css déplacé ici

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
