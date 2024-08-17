import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs
} from "@remix-run/cloudflare";

import { json, redirect } from "@remix-run/cloudflare";

import {
  Form,
  Links,
  Meta,
  Outlet,
  NavLink,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit
} from "@remix-run/react";

import appStylesHref from "./app.css?url";
import { createEmptyMetronome, getMetronomes } from "./data";
import { useEffect } from "react";

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const db = context.cloudflare.env.DB
  const contact = await createEmptyMetronome(db);
  return redirect(`/songs/${contact.id}/edit`);
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export const loader = async ({
  context,
  request,
}: LoaderFunctionArgs) => {
  const db = context.cloudflare.env.DB
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const metronome = await getMetronomes(db, q);
  return json({ metronome, q });
};

export default function App() {
  const { metronome: songs, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has(
      "q"
    );

  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Metromone</h1>
          <div>
            <Form
              id="search-form"
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
              role="search"
            >
              <input
                id="q"
                className={searching ? "loading" : ""}
                aria-label="Search contacts"
                defaultValue={q || ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div
                aria-hidden
                hidden={!searching}
                id="search-spinner"
              />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {songs.length ? (
              <ul>
                {songs.map((song) => (
                  <li key={song.id}>
                    <NavLink
                      className={({ isActive, isPending }) =>
                        isActive
                          ? "active"
                          : isPending
                            ? "pending"
                            : ""
                      }
                      to={`songs/${song.id}`}>
                      {song.name ? song.name : (<i>No Name</i>)}
                      {song.favorite ? (
                        <span>★</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No songs</i>
              </p>
            )}
          </nav>
        </div>

        <div
          className={
            navigation.state === "loading" && !searching
            ? "loading"
            : ""
          }
          id="detail"
        >
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
