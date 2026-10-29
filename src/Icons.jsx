const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const svg = (d, extra = null) => (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...S} {...props}>
    {d.map((p, i) => <path key={i} d={p} />)}
    {extra}
  </svg>
);

export const IconFolder   = svg(['M3 7h7l2 2h9v11H3z']);
export const IconChat     = svg(['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5']);
export const IconInfo     = svg(['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 10v6']);
export const IconLogs     = svg(['M5 4h14v16H5z', 'M8 9h8', 'M8 13h5']);
export const IconScreen   = svg(['M3 5h18v12H3z', 'M9 21h6', 'M12 17v4']);
export const IconRemote   = svg(['M3 5h18v12H3z', 'M9 21h6', 'M12 17v4', 'M9 10l3-3 3 3', 'M9 13l3 3 3-3']);
export const IconCamera   = svg(['M3 8h6l2-3h4l2 3h4v12H3z', 'M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z']);
export const IconKeys     = svg(['M3 7h18v10H3z', 'M6 10h1', 'M10 10h1', 'M14 10h1', 'M18 10h1', 'M8 13h8']);
export const IconBell     = svg(['M12 4a6 6 0 0 1 6 6v4l2 3H4l2-3v-4a6 6 0 0 1 6-6z', 'M10 20h4']);
export const IconGeo      = svg(['M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z', 'M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z']);
export const IconConsole  = svg(['M3 4h18v16H3z', 'M7 9l3 3-3 3', 'M13 15h5']);
export const IconScreenOff= svg(['M3 5h18v12H3z', 'M9 21h6', 'M12 17v4', 'M4 3l17 17']);
export const IconLock     = svg(['M5 11h14v9H5z', 'M8 11V8a4 4 0 0 1 8 0v3']);
export const IconCall     = svg(['M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a1 1 0 0 1-1 1C11 20 4 13 4 5a1 1 0 0 1 1-1z']);
export const IconBuild    = svg(['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5', 'M12 12L4 7.5', 'M12 12v9']);
export const IconVolt     = svg(['M13 2L5 13h5l-1 9 8-11h-5z']);
