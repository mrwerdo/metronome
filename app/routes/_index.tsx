import { StandaloneMetronome } from "~/metronome/views";
import { SongList, loader, action } from "./songs._index";
import { Section, Container } from "@radix-ui/themes";

export { loader, action };

export default function Index() {
    return (
      <>
      <Section size='1'>
        <StandaloneMetronome />
      </Section>
      <Section size='1'>
        <Container p='4'>
          <SongList />
        </Container>
      </Section>
      </>
    );
  }