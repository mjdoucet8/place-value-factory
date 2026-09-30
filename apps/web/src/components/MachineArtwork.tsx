import { formatNumber } from "../formatNumber.js";

const PLACE_COLORS: Record<number, string> = {
  100000: "purple",
  10000: "blue",
  1000: "green",
  100: "amber",
  10: "magenta",
  1: "cyan",
};

/** Separate transparent sprites; values and controls stay live HTML. */
export function MachineArtwork({
  value,
  closed,
}: {
  value: number;
  closed: boolean;
}) {
  return (
    <div className="machine-artwork" aria-hidden="true">
      <div className="dispenser-sprite-frame">
        <img
          src={`/assets/art-v4/dispenser-${PLACE_COLORS[value]}.webp`}
          alt=""
          width="1254"
          height="1254"
          draggable={false}
        />
      </div>
      <span className="machine-place-value">{formatNumber(value)}</span>
      {closed && <span className="machine-closed-badge">CLOSED</span>}
    </div>
  );
}

/** Independent moving crate; the quantity plate travels with its parent. */
export function CrateShell({ value }: { value: number }) {
  return (
    <div className="quantity-crate-art" aria-hidden="true">
      <img
        src={`/assets/art-v4/crate-${PLACE_COLORS[value]}.webp`}
        alt=""
        width="1254"
        height="1254"
        draggable={false}
      />
    </div>
  );
}
