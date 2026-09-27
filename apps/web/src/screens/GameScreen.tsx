import { useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  BusyFactoryScenery,
  FactoryArt,
  Mascot,
} from "../components/FactoryArt.js";
import { formatNumber } from "../formatNumber.js";
import {
  MachineEditor,
  RepresentationMonitor,
} from "../components/MachineEditor.js";

type Props = {
  attempt: any;
  quantities: number[];
  quantitiesB: number[];
  undo: number[] | null;
  notice: string;
  help: string;
  helpOpen: boolean;
  saving: boolean;
  shipmentMotion: "idle" | "departing" | "arriving";
  factoryAlert: boolean;
  pending: boolean;
  pendingConflict: boolean;
  busy: boolean;
  storageUnavailable: boolean;
  tabId: string;
  helpTrigger: RefObject<HTMLButtonElement | null>;
  helpDialog: RefObject<HTMLDivElement | null>;
  setQuantities: Dispatch<SetStateAction<number[]>>;
  setQuantitiesB: Dispatch<SetStateAction<number[]>>;
  setUndo: Dispatch<SetStateAction<number[] | null>>;
  onHelpOpen: () => void;
  onHelpClose: () => void;
  onHelp: () => void;
  onTakeOver: () => void;
  onShip: () => void;
  onRetryPending: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onMap: () => void;
};

export function GameScreen(props: Props) {
  const shiftTabUsed = useRef(false);
  const moveQuantityFocus = (direction: -1 | 1) => {
    const quantities = Array.from(document.querySelectorAll<HTMLInputElement>('.machines input[id^="quantity-"]:not([disabled])'));
    const index = quantities.indexOf(document.activeElement as HTMLInputElement);
    if (index < 0 || !quantities.length) return;
    quantities[(index + direction + quantities.length) % quantities.length].focus();
  };
  if (props.attempt.status === "paused")
    return (
      <main className="paused-screen">
        <section className="paused-card">
          <Mascot pose="welcome" className="paused-mascot" />
          <h1>Mission paused</h1>
          {props.notice ? (
            <p className="paused-notice" role="status">
              {props.notice}
            </p>
          ) : null}
          <div className="paused-actions">
            <button disabled={props.saving} onClick={props.onResume}>
              {props.saving ? "Resuming…" : "Resume mission"}
            </button>
            <button
              className="secondary"
              disabled={props.saving}
              onClick={props.onMap}
            >
              Back to map
            </button>
          </div>
        </section>
        <div className="paused-factory-scene" aria-hidden="true">
          <FactoryArt asset="prop-pipes-gauge" className="paused-pipes" />
          <FactoryArt asset="prop-conveyor" className="paused-conveyor" />
          <FactoryArt asset="prop-shipment" className="paused-shipment" />
        </div>
      </main>
    );
  const order = props.attempt.activeOrder;
  const locked = props.saving || props.pending;
  const busyEnabled =
    props.busy &&
    Number(props.attempt.levelId?.replace("level-", "")) >= 13 &&
    !props.helpOpen;
  const objective =
    order.distinctRepresentations === 2
      ? "Build two different crate representations of this target."
      : order.minimumRequired
        ? "Use the fewest crates with the open machines."
        : order.exactTypes
          ? `Use exactly ${order.exactTypes} crate sizes.`
          : order.canonicalRequired
            ? "Use normal place value: 0–9 crates of each size."
            : order.allowed.length < 6
              ? `Use only: ${order.allowed.map((value: number) => formatNumber(value)).join(", ")}.`
              : "Build this target with the open machines.";
  return (
    <main
      className="game-screen"
      data-busy={busyEnabled}
      data-factory-alert={props.factoryAlert}
      onKeyDownCapture={(event) => {
        if (!(event.target instanceof HTMLInputElement) || !/^quantity-[0-5]$/.test(event.target.id)) return;
        if (event.key === "Enter") {
          event.preventDefault();
          if (!locked) props.onShip();
        } else if (event.key === "Tab" && event.shiftKey) {
          event.preventDefault();
          shiftTabUsed.current = true;
          moveQuantityFocus(-1);
        }
      }}
      onKeyUpCapture={(event) => {
        if (event.key !== "Shift") return;
        if (shiftTabUsed.current) shiftTabUsed.current = false;
        else if (event.target instanceof HTMLInputElement && /^quantity-[0-5]$/.test(event.target.id)) moveQuantityFocus(1);
      }}
    >
      <BusyFactoryScenery enabled={busyEnabled} />
      <header>
        <h1>
          Place Value Factory{" "}
          <small>Level {props.attempt.levelId?.replace("level-", "")}</small>
        </h1>
        <span>
          {props.attempt.status === "completed"
            ? "Extra challenge"
            : `Order ${props.attempt.shippedSlots + 1} of 5`}
        </span>
        <button
          className="header-help secondary"
          ref={props.helpTrigger}
          disabled={locked}
          onClick={props.onHelpOpen}
        >
          Help
        </button>
      </header>
      <div className="factory-brief">
        <aside className="robot-guide" aria-label="Factory guide">
          <Mascot pose="instruct" />
          <p>Let’s pack this number!</p>
        </aside>
        <section className="current-order" aria-labelledby="order-heading">
          <p id="order-heading">CURRENT ORDER</p>
          <strong>{formatNumber(order.target)}</strong>
          <p>{objective}</p>
        </section>
        <aside
          className="play-instructions"
          aria-labelledby="play-instructions-heading"
        >
          <h2 id="play-instructions-heading">How to play</h2>
          <p>
            Enter crate amounts, match the current order, then choose{" "}
            <strong>Ship order</strong>.
          </p>
        </aside>
      </div>
      {(props.attempt.writerTabId !== props.tabId || props.pendingConflict) && (
        <aside className="takeover" role="status">
          <p>
            {props.pendingConflict
              ? "Your unsent crates are saved here. Take over to review them."
              : "This attempt is open in another tab."}
          </p>
          <button onClick={props.onTakeOver}>Take over this attempt</button>
        </aside>
      )}
      {order.sourceRepresentation && (
        <section
          className="source-representation"
          aria-labelledby="source-heading"
        >
          <h2 id="source-heading">Read-only source crates</h2>
          <p>
            Start with this normal place-value packing, then repack it using the
            open machines: {order.sourceRepresentation.join(", ")}.
          </p>
        </section>
      )}
      {props.helpOpen && (
        <div className="dialog-backdrop">
          <div
            className="help-dialog"
            ref={props.helpDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
          >
            <Mascot pose="help" className="dialog-mascot" />
            <h2 id="help-dialog-title">Step-by-step help</h2>
            <p>
              Take it one step at a time. Asking for help never takes away your
              stars.
            </p>
            <button disabled={locked} onClick={props.onHelp}>
              {props.attempt.currentHintStep === "H3"
                ? "Show H3 help again"
                : `Get ${["H1", "H2", "H3"][["H1", "H2", "H3"].indexOf(props.attempt.currentHintStep) + 1] ?? "H1"} help`}
            </button>
            {props.help && <p role="status">{props.help}</p>}
            <button className="secondary" onClick={props.onHelpClose}>
              Close help
            </button>
          </div>
        </div>
      )}
      {props.storageUnavailable && (
        <p className="storage-warning" role="status">
          Device storage is unavailable. Your current draft stays in this tab,
          but it cannot be restored after refresh or close.
        </p>
      )}
      <MachineEditor
        order={order}
        quantities={props.quantities}
        quantitiesB={props.quantitiesB}
        saving={locked}
        shipmentMotion={props.shipmentMotion}
        setQuantities={props.setQuantities}
        setQuantitiesB={props.setQuantitiesB}
      />
      <div className="factory-console">
        <RepresentationMonitor
          quantities={props.quantities}
          quantitiesB={props.quantitiesB}
          twoWays={order.distinctRepresentations === 2}
        />
      <section className="controls">
        <button
          className="secondary"
          disabled={locked}
          onClick={() => {
            props.setUndo(props.quantities);
            props.setQuantities([0, 0, 0, 0, 0, 0]);
          }}
        >
          Clear all
        </button>
        <button
          className="secondary"
          disabled={!props.undo || locked}
          onClick={() => {
            if (props.undo) props.setQuantities(props.undo);
          }}
        >
          Undo
        </button>
        <button className="ship" disabled={locked} onClick={props.onShip}>
          {props.saving
            ? "Saving…"
            : props.pending
              ? "Waiting to save"
              : "Ship order"}
        </button>
        <button className="secondary" disabled={locked} onClick={props.onSkip}>
          Skip after two saved tries
        </button>
        <button className="secondary" disabled={locked} onClick={props.onPause}>
          Pause mission
        </button>
      </section>
      </div>
      {props.pending && !props.saving && (
        <section className="pending-recovery" role="status">
          <p>
            Your work is saved on this device and is waiting for the factory.
          </p>
          <button onClick={props.onRetryPending}>Try saving again</button>
        </section>
      )}
      {props.notice && (
        <aside className="notice" role={props.factoryAlert ? "alert" : "status"}>
          <Mascot
            pose={
              /saved|accepted|correct/i.test(props.notice)
                ? "correct"
                : "encourage"
            }
          />
          <p>{props.notice}</p>
        </aside>
      )}
    </main>
  );
}
