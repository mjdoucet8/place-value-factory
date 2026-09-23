import type { Dispatch, SetStateAction } from "react";
import { PLACES } from "../models.js";

type Props = {
  order: any;
  quantities: number[];
  quantitiesB: number[];
  saving: boolean;
  setQuantities: Dispatch<SetStateAction<number[]>>;
  setQuantitiesB: Dispatch<SetStateAction<number[]>>;
};

export function MachineEditor({
  order,
  quantities,
  quantitiesB,
  saving,
  setQuantities,
  setQuantitiesB,
}: Props) {
  const total = quantities.reduce(
    (sum, amount, index) => sum + amount * PLACES[index].value,
    0,
  );
  return (
    <>
      <section
        className="representation-monitor"
        aria-live="polite"
        aria-label="Current crate representation"
      >
        <p className="monitor-label">REPRESENTATION A</p>
        <strong>{total.toLocaleString()}</strong>
        <p>
          {quantities
            .map(
              (amount, index) =>
                amount > 0 &&
                `${amount} × ${PLACES[index].value.toLocaleString()}`,
            )
            .filter(Boolean)
            .join(" + ") || "Choose crates to build the target."}
        </p>
      </section>
      <section
        className="machines"
        aria-label="Representation A place value machines"
      >
        {PLACES.map((place, index) => (
          <article
            className={`machine machine-${index}`}
            key={place.value}
            aria-disabled={!order.allowed.includes(place.value)}
          >
            <span className="machine-pipe" aria-hidden="true" />
            <span className="machine-hopper" aria-hidden="true" />
            <h2>
              {place.icon} {place.name}
            </h2>
            <p className="machine-value">
              {place.value.toLocaleString()} each{" "}
              {!order.allowed.includes(place.value) &&
                "· Closed for this order"}
            </p>
            <label htmlFor={`quantity-${index}`}>Crate quantity</label>
            <div>
              <button
                aria-label={`Remove one ${place.name} crate`}
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
                inputMode="numeric"
                type="number"
                min="0"
                max="999999"
                disabled={saving || !order.allowed.includes(place.value)}
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
            <span className="machine-crate" aria-hidden="true">
              {quantities[index] > 0
                ? `${quantities[index]} crate${quantities[index] === 1 ? "" : "s"}`
                : "Ready"}
            </span>
            {index < 5 && (
              <button
                className="exchange"
                disabled={
                  saving ||
                  quantities[index] < 1 ||
                  !order.allowed.includes(place.value) ||
                  !order.allowed.includes(PLACES[index + 1].value)
                }
                onClick={() =>
                  setQuantities((values) =>
                    values.map((value, item) =>
                      item === index
                        ? value - 1
                        : item === index + 1
                          ? value + 10
                          : value,
                    ),
                  )
                }
              >
                Exchange 1 for 10 smaller crates
              </button>
            )}
          </article>
        ))}
      </section>
      {order.distinctRepresentations === 2 && (
        <section
          className="second-representation"
          aria-labelledby="representation-b-heading"
        >
          <h2 id="representation-b-heading">Representation B</h2>
          <p>
            Make a different valid crate vector. It must still total{" "}
            {order.target.toLocaleString()}.
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
