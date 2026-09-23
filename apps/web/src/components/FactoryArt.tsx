import type { ImgHTMLAttributes } from "react";

export type MascotPose =
  | "welcome"
  | "instruct"
  | "help"
  | "correct"
  | "encourage"
  | "celebrate";

type ArtProps = ImgHTMLAttributes<HTMLImageElement> & { asset: string };

export function FactoryArt({
  asset,
  className = "",
  height = 512,
  width = 512,
  ...props
}: ArtProps) {
  return (
    <img
      {...props}
      alt=""
      aria-hidden="true"
      className={`factory-art ${className}`}
      height={height}
      src={`/assets/art-v1/${asset}.webp`}
      width={width}
    />
  );
}

export function Mascot({
  pose,
  className = "",
}: {
  pose: MascotPose;
  className?: string;
}) {
  return (
    <FactoryArt
      asset={`mascot-${pose}`}
      className={`mascot mascot-${pose} ${className}`}
    />
  );
}

export function BusyFactoryScenery({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`busy-scenery${enabled ? " is-busy" : ""}`}
      aria-hidden="true"
    >
      <FactoryArt asset="prop-pipes-gauge" className="busy-pipes" />
      <FactoryArt asset="prop-conveyor" className="busy-conveyor" />
      <FactoryArt asset="prop-waiting-pallet" className="busy-pallet" />
      <FactoryArt asset="prop-shipment" className="busy-shipment" />
      <FactoryArt asset="prop-activity-light" className="busy-light" />
      <FactoryArt asset="effect-steam" className="busy-steam" />
    </div>
  );
}
