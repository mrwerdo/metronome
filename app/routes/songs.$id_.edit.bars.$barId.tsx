import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getSong, BarMutation, BarType, setBarsForSong } from "../data";

export const action = async ({
  params,
  request,
  context,
}: ActionFunctionArgs) => {
  invariant(params.id, "Missing id param");
  invariant(params.barId, "Missing barId param");
  const db = context.cloudflare.env.DB
  const formData = await request.formData();
  const action = formData.get('action');
  const bar: BarType = {
    id: parseInt(params.barId),
    bpm: parseInt(formData.get('bpm')?.toString() ?? '120'),
    delay: parseInt(formData.get('delay')?.toString() ?? '0'),
    name: formData.get('name')?.toString() ?? 'Default',
    numberOfBars: parseInt(formData.get('numberOfBars')?.toString() ?? '1'),
    subBeats: parseInt(formData.get('subBeats')?.toString() ?? '1'),
    timeSignature: parseInt(formData.get('timeSignatureNumerator')?.toString() ?? '4'),
    songId: params.id
  }

  const song = await getSong(db, params.id);

  if (song === null) {
    throw new Response("Song Not Found", { status: 404 })
  }
  if (song.bars === undefined) {
    throw new Response("No Bars Defined", { status: 404 });
  }
  const index = song.bars.findIndex(value => value.id === bar.id)
  if (index === -1) {
    throw new Response("Bar Not Found", { status: 404 });
  }

  if (action === 'save') {
    song.bars[index] = bar
    song.bars.every((value, index) => value.id = index)
  } else if (action === 'remove') {
    song.bars.splice(index, 1);
    song.bars.every((value, index) => value.id = index)
  } else if (action === 'add-before') {
    song.bars.splice(index, 0, bar);
    song.bars.every((value, index) => value.id = index)
  } else if (action === 'add-after') {
    song.bars.splice(index + 1, 0, bar);
    song.bars.forEach((value, index) => value.id = index)
  }

  await setBarsForSong(db, song.id, song.bars);
  return null;
};

export const loader = async ({
  params,
  context,
}: LoaderFunctionArgs) => {
  invariant(params.id, "Missing id param");
  invariant(params.barId, "Missing barId param");
  const db = context.cloudflare.env.DB

  const song = await getSong(db, params.id);
  if (!song) {
    throw new Response("Not Found", { status: 404 });
  }

  if (song.bars === null) {
    throw new Response("Bars Not Found", { status: 404 });
  }

  const bar = song.bars?.find((value) => value.id?.toString() === params.barId);
  if (bar === undefined) {
    throw new Response("Bar Not Found", { status: 404 });
  }

  return json({ bar });
};

function BarForm({ bar }: { bar: BarMutation }) {
  return (
    <>
      <Form method="post">
        <div>
          <label>
            ID: {bar.id}
          </label>
        </div>

        <div>
          <label>
            Name:
            <input type="text" name="name" defaultValue={bar.name} />
          </label>
        </div>

        <div>
          <label>
            BPM:
            <input type="number" name="bpm" defaultValue={bar.bpm} />
          </label>
        </div>

        <div>
          <label>
            Time Signature:
            <input
              type="number"
              name="timeSignatureNumerator"
              defaultValue={bar.timeSignature}
            />
          </label>
        </div>

        <div>
          <label>
            Sub-Beats:
            <input type="number" name="subBeats" defaultValue={bar.subBeats} />
          </label>
        </div>

        <div>
          <label>
            Delay:
            <input type="number" name="delay" defaultValue={bar.delay} />
          </label>
        </div>

        <div>
          <label>
            Number of Bars:
            <input type="number" name="numberOfBars" defaultValue={bar.numberOfBars} />
          </label>
        </div>

        <button type="submit" name="action" value="save">Save</button>
        <button type="submit" name="action" value="remove">Remove</button>
        <button type="submit" name="action" value="add-before">Add Bar Before</button>
        <button type="submit" name="action" value="add-after">Add Bar After</button>
      </Form>
    </>
  );
};

export default function EditBar() {
  const { bar } = useLoaderData<typeof loader>();

  return (
    <BarForm key={bar.id} bar={bar}></BarForm>
  );
}
