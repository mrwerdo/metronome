import type {
  ActionFunctionArgs,
  LoaderFunctionArgs
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import {
  Form,
  useLoaderData,
  useNavigation,
  useSubmit,
  Link
} from "@remix-run/react";

import { createSong, getSongs } from "~/data/database";
import { useEffect } from "react";
import { Text, Table, TextField, IconButton, Flex, Box, Badge } from "@radix-ui/themes";
import { MagnifyingGlassIcon, PlusIcon, StarFilledIcon, StarIcon } from "@radix-ui/react-icons";

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const db = context.cloudflare.env.DB
  const contact = await createSong(db);
  return redirect(`/songs/${contact.id}`);
};

export const loader = async ({
  context,
  request,
}: LoaderFunctionArgs) => {
  const db = context.cloudflare.env.DB
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  let songs = await getSongs(db, q);
  return json({ songs, q });
};


const accentColors = ['gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange', 'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime', 'mint', 'sky'] as const;
export type ColorForInstrument = typeof accentColors[number];

function colorForInstrument(instrument: string): ColorForInstrument {
  return ({
    'violin' : 'lime',
    'guitar' : 'ruby',
    'piano' : 'indigo',
    'voice' : 'pink',
    'flute' : 'blue',
    'drums' : 'gold'
  }[instrument.toLowerCase()] ?? 'gray') as ColorForInstrument;
}

export { SongList }
export default function SongList() {
  const { songs, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isAtSongs = navigation.location?.pathname.startsWith('/songs');

  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);
  return <>
    <Flex gap='1em' justify='between' align='center'>
      <Box flexGrow={{ initial: "0", lg: "1" }}>
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
          <TextField.Root id="q" placeholder="Search..." type="search" name="q" defaultValue={q || ""} aria-label="Search songs">
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
        </Form>
      </Box>
      <Form method="post">
        <IconButton>
          <PlusIcon />
        </IconButton>
      </Form>
    </Flex>
        {songs.length ? (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell><StarFilledIcon/></Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell><Text size='4'>Name</Text></Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell><Text size='4'>Instrument</Text></Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {songs.map((song) => (
                <Table.Row key={song.id}>
                  <Table.Cell>
                    { song.favorite ? <StarIcon /> : <StarFilledIcon />}
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`${isAtSongs ? './' : '/songs/'}${song.id}`}>
                      <Text size='3'>{song.name ? song.name : (<i>No Name</i>)}</Text>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size='3' color={colorForInstrument(song.instrument)}>
                      {song.instrument}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>  
          ) : (<p>No Songs</p>)
        }
  </>;
}