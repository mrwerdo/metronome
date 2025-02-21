import React, { useState } from 'react';

import backSvg from '~/assets/svgs/Controls/Back.svg';
import beginningSvg from '~/assets/svgs/Controls/Beginning.svg';
import endSvg from '~/assets/svgs/Controls/End.svg';
import forwardSvg from '~/assets/svgs/Controls/Forward.svg';
import pauseSvg from '~/assets/svgs/Controls/Pause.svg';
import playSvg from '~/assets/svgs/Controls/Play.svg';
import settingsSvg from '~/assets/svgs/Controls/Settings.svg';

const style = { width: 50, height: 50 };


function Button(props: { onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={props.onClick}>{props.children}</button>
  )
}

export const Back = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={backSvg}></img>
    </Button>
  )
}

export const Beginning = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={beginningSvg}></img>
    </Button>
  )
}

export const CountIn = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={beginningSvg}></img>
    </Button>
  )
}

export const End = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={endSvg}></img>
    </Button>
  )
}

export const Forward = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={forwardSvg}></img>
    </Button>
  )
}

export const Play = (props: {isPlaying: boolean, onClick: () => void}) => {
  return (
    <Button onClick={() => { props.onClick() }}>
      {
        props.isPlaying ?
          <img style={style} src={pauseSvg}></img> :
          <img style={style} src={playSvg}></img>
      }
    </Button>
  )
}

export const Settings = (props: {onClick: () => void}) => {
  return (
    <Button onClick={() => props.onClick()}>
      <img style={style} src={settingsSvg}></img>
    </Button>
  )
}

