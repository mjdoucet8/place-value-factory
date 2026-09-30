import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { MachineArtwork, CrateShell } from "./MachineArtwork.js";
import { PLACES } from "../models.js";
import { formatNumber } from "../formatNumber.js";

type Props = {
  order: any;
  quantities: number[];
  quantitiesB: number[];
  saving: boolean;
  shipmentMotion: "idle" | "departing" | "arriving";
  setQuantities: Dispatch<SetStateAction<number[]>>;
  setQuantitiesB: Dispatch<SetStateAction<number[]>>;
};

export function MachineEditor({
  order,
  quantities,
  quantitiesB,
  saving,
  shipmentMotion,
  setQuantities,
  setQuantitiesB,
}: Props) {
  const exchangeAt = (index: number) =>
    setQuantities((values) =>
      values.map((value, item) =>
        item === index ? value - 1 : item === index + 1 ? value + 10 : value,
      ),
    );
  return (
    <>
      <div
        className="production-line"
        data-shipment-motion={shipmentMotion}
        role="region"
        aria-label="Factory conveyor and crate controls"
        tabIndex={0}
      >
        <section
          className="machines"
          aria-label="Representation A place value machines"
        >
          {PLACES.map((place, index) => (
            <article
              className={`machine illustrated-machine machine-${index}`}
              key={place.value}
              aria-disabled={!order.allowed.includes(place.value)}
            >
              <h2>
                {place.icon} {place.name}
              </h2>
              <div className="workstation-art">
                <MachineArtwork
                  value={place.value}
                  closed={!order.allowed.includes(place.value)}
                />
                <div className="editable-crate">
                  <CrateShell value={place.value} />
                  <label htmlFor={`quantity-${index}`}>CRATES</label>
                  <div className="quantity-controls">
                    <button
                      aria-label={`Remove one ${place.name} crate`}
                      tabIndex={-1}
                      disabled={saving || !order.allowed.includes(place.value)}
                      onClick={() =>
                        setQuantities((values) =>
                          values.map((value, item) =>
                            item === index ? Math.max(0, value - 1) : value,
                          ),
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      id={`quantity-${index}`}
                      aria-label={`${place.name} crate quantity`}
                      inputMode="numeric"
                      type="number"
                      min="0"
                      max="999999"
                      disabled={saving || !order.allowed.includes(place.value)}
                      style={
                        {
                          "--quantity-digits": String(quantities[index]).length,
                        } as CSSProperties
                      }
                      value={quantities[index]}
                      onFocus={(event) => {
                        if (event.currentTarget.value === "0")
                          event.currentTarget.select();
                      }}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isInteger(value) && value >= 0)
                          setQuantities((values) =>
                            values.map((amount, item) =>
                              item === index ? value : amount,
                            ),
                          );
                      }}
                    />
                    <button
                      aria-label={`Add one ${place.name} crate`}
                      tabIndex={-1}
                      disabled={saving || !order.allowed.includes(place.value)}
                      onClick={() =>
                        setQuantities((values) =>
                          values.map((value, item) =>
                            item === index ? value + 1 : value,
                          ),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <p className="crate-inventory">
                {order.allowed.includes(place.value)
                  ? quantities[index] > 0
                    ? `× ${formatNumber(quantities[index])} crate${quantities[index] === 1 ? "" : "s"}`
                    : "No crates yet"
                  : "Closed for this order"}
              </p>
            </article>
          ))}
        </section>
        <div className="exchange-row" aria-label="Crate trade actions">
          {PLACES.map((place, index) =>
            index < 5 ? (
              <button
                className="exchange"
                key={place.value}
                disabled={
                  saving ||
                  quantities[index] < 1 ||
                  !order.allowed.includes(place.value) ||
                  !order.allowed.includes(PLACES[index + 1].value)
                }
                onClick={() => exchangeAt(index)}
              >
                Trade 1 for 10 smaller
              </button>
            ) : (
              <span aria-hidden="true" key={place.value} />
            ),
          )}
        </div>
      </div>
      {order.distinctRepresentations === 2 && (
        <section
          className="second-representation"
          aria-labelledby="representation-b-heading"
        >
          <h2 id="representation-b-heading">Representation B</h2>
          <p>
            Pack the number a different way. Both packings must total{" "}
            {formatNumber(order.target)}.
          </p>
          <div>
            {PLACES.map((place, index) => (
              <label key={place.value}>
                {place.name}
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="999999"
                  disabled={saving || !order.allowed.includes(place.value)}
                  value={quantitiesB[index]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 0)
                      setQuantitiesB((values) =>
                        values.map((amount, item) =>
                          item === index ? value : amount,
                        ),
                      );
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function RepresentationMonitor({
  quantities,
  quantitiesB,
  twoWays = false,
}: {
  quantities: number[];
  quantitiesB: number[];
  twoWays?: boolean;
}) {
  return (
    <section
      className="representation-monitor"
      aria-label="Current crate representation"
    >
      {(twoWays ? [quantities, quantitiesB] : [quantities]).map(
        (values, representation) => {
          const total = values.reduce(
            (sum, amount, index) => sum + amount * PLACES[index].value,
            0,
          );
          return (
            <div key={representation}>
              <p className="monitor-label">
                {twoWays
                  ? `PACKING ${representation === 0 ? "A" : "B"}`
                  : "YOUR PACKING"}
              </p>
              <strong aria-label={`Total ${formatNumber(total)}`}>
                {formatNumber(total)}
              </strong>
              <p className="expression">
                {values
                  .map((amount, index) =>
                    amount > 0
                      ? `${formatNumber(amount)} × ${formatNumber(PLACES[index].value)}`
                      : null,
                  )
                  .filter(Boolean)
                  .join(" + ") || "Choose crates to build the number."}
              </p>
            </div>
          );
        },
      )}
    </section>
  );
}
