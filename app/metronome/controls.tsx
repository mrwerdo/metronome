import { IconButton } from '@radix-ui/themes';
import React from 'react';

import BackSvg from '~/assets/svgs/Controls/Back.svg?react';
import BeginningSvg from '~/assets/svgs/Controls/Beginning.svg?react';
import EndSvg from '~/assets/svgs/Controls/End.svg?react';
import ForwardSvg from '~/assets/svgs/Controls/Forward.svg?react';
import PauseSvgIcon from '~/assets/svgs/Controls/Pause.svg?react';
import PlaySvgIcon from '~/assets/svgs/Controls/Play.svg?react';
import SettingsSvg from '~/assets/svgs/Controls/Settings.svg?react';
import FasterSvg from '~/assets/svgs/Controls/Tempo/Faster.svg?react';
import SlowerSvg from '~/assets/svgs/Controls/Tempo/Slower.svg?react';

const style = { color: '--var(--accent-1)', width: 50, height: 50, margin: '4px' };

function Button(props: { onClick: () => void, children: React.ReactNode }) {
  return <IconButton size='4' onClick={props.onClick}>
    {props.children}
  </IconButton>;
}

export const Back = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <BackSvg style={style} />
    </Button>
  )
}

export const Beginning = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <BeginningSvg style={style} />
    </Button>
  )
}

export const CountIn = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <BeginningSvg style={style} />
    </Button>
  )
}

export const End = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <EndSvg style={style} />
    </Button>
  )
}

export const Forward = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <ForwardSvg style={style} />
    </Button>
  )
}

export const Play = (props: {isPlaying: boolean, onClick: () => void}) => {
  return (
    <Button onClick={() => { props.onClick() }}>
      {
        props.isPlaying ? <PauseSvgIcon style={style} /> : <PlaySvgIcon style={style} />
      }
    </Button>
  )
}

export const Settings = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <SettingsSvg style={style} />
    </Button>
  )
}

export const Faster = (props: {onClick: () => void}) => {
  const style={width: 30, height: 30}
  return (
    <button style={{padding: '0.5em'}} onClick={props.onClick}>
      <FasterSvg style={style} />
    </button>
  )
}

export const Slower = (props: {onClick: () => void}) => {
  const style={width: 30, height: 30}
  return (
    <button style={{padding: '0.5em'}} onClick={props.onClick}>
      <SlowerSvg style={style} />
    </button>
  )
}

export const PlusMinusControl = ({ name, onIncrease, onDecrease } : { name: string, onIncrease: () => void, onDecrease: () => void  }) => {
  return <div style={{
    border: '2px solid #E0E0E2',
    display: 'grid',
    gridTemplateAreas: `'a a a a' 'b b c c' 'b b c c'`,
    }}>
    <p style={{
    gridArea: 'a',
    margin: '0',
    paddingLeft: '0.5em',
    paddingRight: '0.5em',
    borderBottomWidth: '2px',
    borderBottomColor: '#ABD2FA',
    borderBottomStyle: 'solid',
    }}>{name}</p>  
    <button style={{gridArea: 'b', margin: '0.5em'}} onClick={onDecrease}>-1</button>
    <button style={{gridArea: 'c', margin: '0.5em'}} onClick={onIncrease}>+1</button>
  </div>
};