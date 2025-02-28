import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, useNavigate, useRouteLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getSong, updateSong, SongType } from "../data";

export const action = async ({
    params,
    request,
    context,
}: ActionFunctionArgs) => {
    invariant(params.id, "Missing id param");
    const db = context.cloudflare.env.DB
    const formData = await request.formData();
    const action = formData.get('action');

    const song = await getSong(db, params.id);
    if (!song) {
      throw new Response("Not Found", { status: 404 });
    }

    if (action === "save") {
      song.name = formData.get('name')?.toString() ?? song.name;
      song.instrument = formData.get('instrument')?.toString() ?? song.instrument;
      await updateSong(db, song.id, song);
    } else if (action === 'new-bar') {
      song.sections = [
        {
          id: 0,
          bpm: 120,
          delay: 0,
          name: 'Section 1',
          numberOfBars: 10,
          subBeats: 1,
          timeSignature: 4
        }
      ]
      await updateSong(db, song.id, song);
    } else {
      throw new Response("Bad Request", { status: 400 });
    }
    
    return {};
};

export const loader = async ({
  params,
  context,
}: LoaderFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const db = context.cloudflare.env.DB
  const song = await getSong(db, params.id);
  if (!song) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ song });
};

interface ParentLoaderData {
  song: SongType;
}


export default function EditBars() {
  const navigate = useNavigate();
  const data = useRouteLoaderData<ParentLoaderData>("routes/songs.$id");
  if (!data) {
    return <div>Loading...</div>
  }

  let shouldShowNewButton: boolean

  const song = data.song;

  if (song.sections === undefined) {
    shouldShowNewButton = true;
  } else {
    shouldShowNewButton = song.sections.length === 0
  }

  return (
    <div key={song.id}>
      <Form method="post">
        <div>
          <label>
            Name:
            <input type="text" name="name" defaultValue={song.name} />
          </label>
        </div>

        <div>
          <label>
            Instrument:
            <input type="text" name="instrument" defaultValue={song.instrument} />
          </label>
        </div>
        <button type="submit" name="action" value="save">Save</button>
        <button onClick={() => navigate(-1)} type="button">
          Back
        </button>
        {
          shouldShowNewButton ? <button type="submit" name="action" value="new-bar">Add Bar</button> : null
        }
      </Form>
    </div>
  )
};


