import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getSong, SectionMutation, SectionType, updateSong } from "../data";

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
  const bar: SectionType = {
    id: parseInt(params.barId),
    bpm: parseInt(formData.get('bpm')?.toString() ?? '120'),
    delay: parseInt(formData.get('delay')?.toString() ?? '0'),
    name: formData.get('name')?.toString() ?? 'Default',
    numberOfBars: parseInt(formData.get('numberOfBars')?.toString() ?? '1'),
    numberOfSubBeats: parseInt(formData.get('subBeats')?.toString() ?? '1'),
    numberOfBeats: parseInt(formData.get('timeSignatureNumerator')?.toString() ?? '4'),
  }

  const song = await getSong(db, params.id);

  if (song === null) {
    throw new Response("Song Not Found", { status: 404 })
  }
  if (song.sections === undefined) {
    throw new Response("No Bars Defined", { status: 404 });
  }
  const index = song.sections.findIndex(value => value.id === bar.id)
  if (index === -1) {
    throw new Response("Bar Not Found", { status: 404 });
  }

  if (action === 'save') {
    song.sections[index] = bar
    song.sections.every((value, index) => value.id = index)
  } else if (action === 'remove') {
    song.sections.splice(index, 1);
    song.sections.every((value, index) => value.id = index)
    await updateSong(db, params.id, song);
    if (song.sections.length === 0) {
      return redirect("/songs/" + params.id + "/edit");
    } else {
      return redirect("/songs/" + params.id + "/edit/bars/" + Math.max(0, (index - 1)));
    }
  } else if (action === 'add-before') {
    song.sections.splice(index, 0, bar);
    song.sections.every((value, index) => value.id = index)
  } else if (action === 'add-after') {
    song.sections.splice(index + 1, 0, bar);
    song.sections.forEach((value, index) => value.id = index)
  }

  return await updateSong(db, params.id, song);
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

  if (song.sections === null) {
    throw new Response("Bars Not Found", { status: 404 });
  }

  const bar = song.sections?.find((value) => value.id?.toString() === params.barId);
  if (bar === undefined) {
    throw new Response("Bar Not Found", { status: 404 });
  }

  return json({ bar });
};

function BarForm({ bar }: { bar: SectionMutation }) {
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
              defaultValue={bar.numberOfBeats}
            />
          </label>
        </div>

        <div>
          <label>
            Sub-Beats:
            <input type="number" name="subBeats" defaultValue={bar.numberOfSubBeats} />
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
