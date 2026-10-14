// Line icons and the title emblem, drawn as inline SVG (24×24, stroke = currentColor).
// Original shapes in the thin geometric style of Wuthering Waves menus — no official logos or icons.
const P={
 // elements
 glacio:'<path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5"/><path d="M12 8.3l3.2 1.85v3.7L12 15.7l-3.2-1.85v-3.7z"/><path d="M10.3 3.8 12 5.3l1.7-1.5M10.3 20.2 12 18.7l1.7 1.5"/>',
 fusion:'<path d="M12 2.8c2.9 3.6 6.2 6.1 6.2 10.4a6.2 6.2 0 0 1-12.4 0c0-2.6 1.5-4.3 3.1-5.8.1 2 1 3.2 2.2 3.8-.4-3 .1-5.6.9-8.4z"/><path d="M12 13.6c1.3 1.1 2 2.1 2 3.3a2 2 0 0 1-4 0c0-1.2.7-2.2 2-3.3z"/>',
 electro:'<path d="M13.8 2.5 5.5 13.6h5.6l-1.6 7.9 8.9-11.8h-5.8z"/>',
 aero:'<path d="M3 9.2h11.3a3 3 0 1 0-3-3"/><path d="M3 13.2h15a3.2 3.2 0 1 1-3.2 3.2"/><path d="M3 17.2h7.5"/>',
 spectro:'<path d="M12 2.2l2.3 7.5 7.5 2.3-7.5 2.3-2.3 7.5-2.3-7.5L2.2 12l7.5-2.3z"/><circle cx="12" cy="12" r="1.6"/>',
 havoc:'<circle cx="12" cy="12" r="8.6"/><path d="M14.4 6.8a5.4 5.4 0 1 0 0 10.4 6.6 6.6 0 0 1 0-10.4z" fill="currentColor" stroke="none"/>',
 // roles
 main:'<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M8.6 8.6a4.8 4.8 0 0 0 0 6.8M15.4 8.6a4.8 4.8 0 0 1 0 6.8M6 6a8.5 8.5 0 0 0 0 12M18 6a8.5 8.5 0 0 1 0 12"/>',
 coord:'<circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/>',
 combo:'<path d="M4 15.5 15.5 4M8.5 20 20 8.5"/><path d="M14.5 18.5l1.5 1.5M18.5 14.5 20 16"/>',
 tune:'<path d="M8.8 3v8.6a3.2 3.2 0 0 0 6.4 0V3"/><path d="M12 14.8V21M9 21h6"/>',
 // interface
 heart:'<path d="M12 20s-7.2-4.4-7.2-10.1A4.1 4.1 0 0 1 12 7.3a4.1 4.1 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20z"/>',
 coin:'<path d="M12 2.6l8.1 4.7v9.4L12 21.4l-8.1-4.7V7.3z"/><path d="M12 8.2l3.8 3.8-3.8 3.8-3.8-3.8z"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="1.4"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9M12 14.4v2.6"/>',
 unlock:'<rect x="5" y="10.5" width="14" height="10" rx="1.4"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.3-1.5"/>',
 refresh:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 3.8v4.6h-4.6"/>',
 restart:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.8v4.6h4.6"/>',
 soundOn:'<path d="M4 9.4h3.4L12 5.6v12.8l-4.6-3.8H4z"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6M18 6.6a7.6 7.6 0 0 1 0 10.8"/>',
 soundOff:'<path d="M4 9.4h3.4L12 5.6v12.8l-4.6-3.8H4z"/><path d="M16 9.6l4.8 4.8M20.8 9.6 16 14.4"/>',
 motion:'<path d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21"/><path d="M12 9.4l2.6 2.6-2.6 2.6-2.6-2.6z"/>',
 help:'<circle cx="12" cy="12" r="8.8"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8v.5"/><circle cx="12" cy="16.9" r=".6" fill="currentColor"/>',
 blade:'<path d="M18.8 3.2 20.8 5.2 9.5 16.5l-2-2z"/><path d="M5.2 12.4l6.4 6.4M4 18.4l1.6 1.6M7.4 16.6 5 19"/>',
 boss:'<path d="M3.6 18.4h16.8"/><path d="M4.4 18.4 3.2 8l5 4 3.8-7 3.8 7 5-4-1.2 10.4"/>',
 echo:'<path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z"/><path d="M12 8.2l3.8 3.8-3.8 3.8-3.8-3.8z"/>',
 path:'<path d="M12 3.2l8.8 8.8-8.8 8.8L3.2 12z"/>',
 arena:'<path d="M5 19 19 5M15 5h4v4M19 19 5 5M9 5H5v4"/>',
 full:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
 exitFull:'<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>',
 solo:'<path d="M12 3.2l8.8 8.8-8.8 8.8L3.2 12z"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>'
};
const TRAIT={응결:'glacio',용융:'fusion',전도:'electro',기류:'aero',회절:'spectro',인멸:'havoc',공명:'main',협동:'coord',연격:'combo',조율:'tune'};
export function icon(name,cls=''){const d=P[TRAIT[name]||name];if(!d)return '';return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;}

// Title emblem: a tide ring crossed by a single resonance line. Original design.
export const EMBLEM=`<svg class="emblem" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
<circle cx="32" cy="32" r="26" stroke-width="1.6" opacity=".9"/>
<circle cx="32" cy="32" r="19" stroke-width="1" opacity=".45" stroke-dasharray="2 3"/>
<path d="M32 2v60" stroke-width="1.6"/>
<path d="M10 36c4.5-4 9-4 13.5 0s9 4 13.5 0 9-4 13.5 0" stroke-width="2"/>
<path d="M14 43c3.6-3 7.2-3 10.8 0s7.2 3 10.8 0 7.2-3 10.8 0" stroke-width="1.2" opacity=".6"/>
<path d="M32 15l5 5-5 5-5-5z" fill="currentColor" stroke="none"/>
</svg>`;
export function logo(cls=''){return `<span class="logo ${cls}">${EMBLEM}<span class="logo-type"><b>공명전선</b><small>RESONANCE<i></i>FRONT</small></span></span>`;}
export const FAVICON='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0e1015"/>${EMBLEM.replace('class="emblem" ','').replace(/currentColor/g,'#e9cf8e').replace(/<svg[^>]*>|<\/svg>/g,'')}</svg>`);
