import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getMetronome, SongRecord, updateMetronome, BarMutation } from "../data";

export const action = async ({
    params,
    request,
}: ActionFunctionArgs) => {
    invariant(params.id, "Missing id param");
    const formData = await request.formData();
    const action = formData.get('action');
    if (action === 'save') {
      const updates = Object.fromEntries(formData);
      await updateMetronome(params.id, updates);
      return redirect(`/songs/${params.id}`);
    } else if (action === 'new-bar') {
      await updateMetronome(params.id, {
        bars: [
          {
            id: 0,
            bpm: 40,
            delay: 0,
            name: 'Lento',
            numberOfBars: 2,
            subBeats: 4,
            timeSignature: [4, 4]
          }
        ]
      })
      return null;
    } else {
      throw new Response("Bad Request", { status: 400 });
    }
};

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.id, "Missing id param");
  const song = await getMetronome(params.id);
  if (!song) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ song });
};

function Bar({ bar, index }: { bar: BarMutation, index: number }) {
  return <div style={{padding: '1em'}}>
    <p>Bar {index + 1}</p>
    <Link to={`bars/${bar.id}`} replace>{bar.name}</Link>
  </div>
}

const SongMutationForm = ({ song }: { song: SongRecord }) => {
  const navigate = useNavigate();

  let shouldShowNewButton: boolean

  if (song.bars === undefined) {
    shouldShowNewButton = true;
  } else {
    shouldShowNewButton = song.bars.length === 0
  }

  return (
    <>
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
      <div style={{ display: 'flex' }}>
        {
          !song.bars ? null : song.bars.map((value, index) => {
            return <Bar key={index} bar={value} index={index}></Bar>
          })
        }
      </div>
      <Outlet />
    </>
  );
};


export default function EditContact() {
  const { song } = useLoaderData<typeof loader>();

  return (
    <SongMutationForm key={song.id} song={song}></SongMutationForm>
  );
}
