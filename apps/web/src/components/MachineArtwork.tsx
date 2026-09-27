import { useId } from "react";
import { formatNumber } from "../formatNumber.js";

/** Decorative equipment. Exact quantities and controls remain semantic HTML. */

export function MachineArtwork({ value, closed }: { value: number; closed: boolean }) {
  const id = useId().replaceAll(":", "");
  const metal = `${id}-metal`, paint = `${id}-paint`, face = `${id}-face`;
  return <svg className="machine-artwork" viewBox="0 0 190 140" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={metal} x2="1" y2="0"><stop stopColor="#142d65"/><stop offset=".3" stopColor="#789ce6"/><stop offset=".5" stopColor="#365aa5"/><stop offset="1" stopColor="#152e66"/></linearGradient>
      <linearGradient id={paint} x2=".7" y2="1"><stop className="paint-light"/><stop offset=".45" className="paint-base"/><stop offset="1" className="paint-dark"/></linearGradient>
      <linearGradient id={face} x2="0" y2="1"><stop className="paint-light"/><stop offset=".3" className="paint-base"/><stop offset="1" className="paint-dark"/></linearGradient>
    </defs>
    <path d="M85 37V17Q85 7 99 7H117" fill="none" stroke="#142957" strokeWidth="24"/>
    <path d="M85 37V17Q85 7 99 7H117" fill="none" stroke={`url(#${metal})`} strokeWidth="17"/>
    <rect x="107" y="0" width="10" height="17" rx="3" fill="#84b6ff"/>
    <path d="M40 72V177 M148 72V177" stroke="#122b5c" strokeWidth="16"/>
    <path d="M40 72V177 M148 72V177" stroke={`url(#${metal})`} strokeWidth="10"/>
    <path d="M18 42 31 29H162L175 42V84L119 125H74L18 84Z" fill={`url(#${paint})`} stroke="#102653" strokeWidth="3"/>
    <path d="M20 43H172 M31 32H159" stroke="white" strokeOpacity=".55" strokeWidth="4"/>
    <path d="M23 83 76 118H116L168 83" fill="none" stroke="#102653" strokeOpacity=".35" strokeWidth="4"/>
    <rect x="29" y="46" width="135" height="34" rx="8" fill="#102653" stroke="#ffffff" strokeOpacity=".45" strokeWidth="3"/>
    <text x="96" y="70" textAnchor="middle" fill="#fff" fontSize="23" fontWeight="900">{formatNumber(value)}</text>
    <path d="M77 123H116L111 134H82Z" fill={`url(#${metal})`} stroke="#102653" strokeWidth="2"/>
    {closed && <g><rect x="47" y="99" width="99" height="29" rx="5" fill="#142957" stroke="#ffcf4a" strokeWidth="2"/><text x="97" y="118" textAnchor="middle" fill="#ffdf77" fontSize="12" fontWeight="900">CLOSED</text></g>}
  </svg>;
}


/** Open crate shell; the editable HTML quantity plate is layered on its front. */
export function CrateShell() {
  return <svg className="quantity-crate-art" viewBox="0 0 190 140" aria-hidden="true" focusable="false">
    <ellipse cx="98" cy="132" rx="87" ry="7" fill="#081b43" opacity=".4" />
    <path d="M10 33 42 10H181L149 34Z" className="crate-rim" />
    <path d="M23 30 46 16H166L145 30Z" fill="#122449" />
    <path d="M10 34H149V129L10 119Z" className="crate-front" />
    <path d="M149 34 181 10V106L149 129Z" className="crate-side" />
    <path d="M33 46V111 M58 46V114 M83 46V116 M108 46V118 M132 46V121 M159 40V113 M171 30V103" className="crate-groove" />
    <path d="M8 32H151V48L8 45Z M8 105 151 115V131L8 121Z" className="crate-rim" />
    <path d="M151 32 183 9V25L151 48Z M151 115 183 92V108L151 131Z" className="crate-side" />
    <path d="M17 49V103 M141 51V111" className="crate-edge-stroke" strokeWidth="8" />
    <path d="M13 35H145 M13 109 144 119 M154 35 177 18" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="3" />
    <g fill="#122449" opacity=".65"><circle cx="18" cy="40" r="2"/><circle cx="139" cy="40" r="2"/><circle cx="18" cy="115" r="2"/><circle cx="139" cy="124" r="2"/></g>
  </svg>;
}
