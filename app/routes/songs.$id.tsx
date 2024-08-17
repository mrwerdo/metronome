import { json } from "@remix-run/cloudflare";
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import { type FunctionComponent } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/cloudflare";
import invariant from "tiny-invariant";
import { getMetronome, updateMetronome } from "../data";
import type { BarMutation, SongRecord } from "../data";
import { MetronomeCounter } from "~/metronome";

export const loader = async ({
  params,
  context,
}: LoaderFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const db = context.cloudflare.env.DB
  const contact = await getMetronome(db, params.id);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

export const action = async ({
  params,
  request,
  context,
}: ActionFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const db = context.cloudflare.env.DB
  const formData = await request.formData();
  return updateMetronome(db, params.id, {
    favorite: formData.get("favorite") === "true",
  });
};

function Bar({ bar }: { bar: BarMutation }) {
  return <div>
    {bar.name}
  </div>
}

export default function Songs() {
  const { contact: song } = useLoaderData<typeof loader>();

  return (
    <div id="contact">
      <div>
        <h1>
          {song.name ? song.name : (<i>No Name</i>)}
          <Favorite song={song} />
        </h1>

        <p>{song.instrument}</p>

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
        <div style={{ display: 'flex' }}>
          {
            !song.bars ? null : song.bars.map((value, index) => {
              return <Bar key={index} bar={value}></Bar>
            })
          }
        </div>
      </div>
      <MetronomeCounter song={song} />
    </div>
  );
}

const Favorite: FunctionComponent<{
  song: Pick<SongRecord, "favorite">;
}> = ({ song }) => {
  const fetcher = useFetcher();
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : song.favorite;

  return (
    <fetcher.Form method="post">
      <button
        aria-label={
          favorite
            ? "Remove from favorites"
            : "Add to favorites"
        }
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
