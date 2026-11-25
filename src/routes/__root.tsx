import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { FxProvider } from "@/lib/fx";
import { AudioProvider } from "@/lib/audio";
import { Scene } from "@/components/fx/Scene";
import { Header } from "@/components/layout/Header";
import { Player } from "@/components/layout/Player";
import { Footer } from "@/components/layout/Footer";
import { Intro } from "@/components/layout/Intro";
import { RouteTransition } from "@/components/layout/RouteTransition";
import { CONFIG } from "@/config";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-20">
      <div className="panel max-w-md rounded-xl p-10 text-center">
        <p className="label-mono">// Signal lost</p>
        <h1 className="font-slant mt-3 text-8xl text-pink text-glow">404</h1>
        <h2 className="font-slant mt-2 text-3xl">Dead air</h2>
        <p className="mt-3 text-sm text-muted-foreground">This frequency is empty. The beats are still playing on the homepage.</p>
        <Link to="/" className="mt-6 inline-flex rounded bg-pink-grad px-6 py-3 font-bold uppercase text-primary-foreground glow-pink">
          Back to the station
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RadioStation",
  name: "Wicked Beats Radio",
  url: CONFIG.SITE_URL + "/",
  logo: CONFIG.LOGO_URL,
  image: CONFIG.LOGO_URL,
  address: { "@type": "PostalAddress", addressLocality: "Birmingham", addressCountry: "UK" },
  sameAs: [CONFIG.SOCIAL.instagram.url, CONFIG.SOCIAL.tiktok.url, CONFIG.SOCIAL.facebook.url],
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#050506" },
      { property: "og:site_name", content: "Wicked Beats Radio" },
      { name: "author", content: "Wicked Beats Radio" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
    scripts: [
      { src: `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_MEASUREMENT_ID}`, async: true },
      {
        children: [
          "window.dataLayer = window.dataLayer || [];",
          "function gtag(){dataLayer.push(arguments);}",
          "gtag('js', new Date());",
          `gtag('config', '${CONFIG.GA_MEASUREMENT_ID}');`,
        ].join("\n"),
      },
      { type: "application/ld+json", children: JSON.stringify(jsonLd) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <QueryClientProvider client={queryClient}>
      <FxProvider>
        <AudioProvider>
          {/* Persistent layer: never unmounts on navigation */}
          <Scene />
          <Header />
          <div id="app-shell" className="relative z-10">
            <motion.main key={path} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] }}>
              <Outlet />
            </motion.main>
            <Footer />
          </div>
          <Player />
          <RouteTransition />
          <Intro />
        </AudioProvider>
      </FxProvider>
    </QueryClientProvider>
  );
}
