import type {
  LinksFunction,
} from "@remix-run/cloudflare";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { ThemeProvider } from "next-themes";
import "@radix-ui/themes/styles.css";
import 'remixicon/fonts/remixicon.css'
import { Theme, ThemePanel } from "@radix-ui/themes";

import appStylesHref from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export default function App() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* <ThemeProvider attribute="class"> */}
          <Theme>
            <Outlet />
            <ThemePanel defaultOpen={false} />
          </Theme>
        {/* </ThemeProvider> */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
