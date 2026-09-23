import type { Dispatch, RefObject, SetStateAction } from "react";
import { BusyFactoryScenery, Mascot } from "../components/FactoryArt.js";
import { MachineEditor } from "../components/MachineEditor.js";

type Props = {
  attempt: any;
  quantities: number[];
  quantitiesB: number[];
  undo: number[] | null;
  notice: string;
  help: string;
  helpOpen: boolean;
  saving: boolean;
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
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onMap: () => void;
};

export function GameScreen(props: Props) {
  if (props.attempt.status === "paused")
    return (
      <main className="results">
        <Mascot pose="welcome" className="state-mascot" />
        <h1>Mission paused</h1>
        <p>
          Your draft is kept on this device and your saved order is ready to
          resume.
        </p>
        <button onClick={props.onResume}>Resume mission</button>
        <button className="secondary" onClick={props.onMap}>
          Back to map
        </button>
      </main>
    );
  const order = props.attempt.activeOrder;
  const objective =
    order.distinctRepresentations === 2
      ? "Build two different crate representations of this target."
      : order.minimumRequired
        ? "Use the fewest crates with the open machines."
        : order.exactTypes
          ? `Use exactly ${order.exactTypes} crate sizes.`
          : order.allowed.length < 6
            ? `Use only: ${order.allowed.map((value: number) => value.toLocaleString()).join(", ")}.`
            : order.canonicalRequired
              ? "Use normal place value: 0–9 crates of each size."
              : "Build this target with the open machines.";
  return (
    <main className="game-screen">
      <BusyFactoryScenery enabled={props.busy} />
      <header>
        <h1>Place Value Factory</h1>
        <span>Order {props.attempt.shippedSlots + 1} of 5</span>
        <button
          className="header-help secondary"
          ref={props.helpTrigger}
          disabled={props.saving}
          onClick={props.onHelpOpen}
        >
          Help
        </button>
      </header>
      <aside className="robot-guide" aria-label="Factory guide">
        <Mascot pose="instruct" />
        <p>
          Build the target with the open crate machines. Your total updates as
          you pack.
        </p>
      </aside>
      {props.attempt.writerTabId !== props.tabId && (
        <aside className="takeover" role="status">
          <p>This attempt is open in another tab.</p>
          <button onClick={props.onTakeOver}>Take over this attempt</button>
        </aside>
      )}
      <section className="current-order" aria-labelledby="order-heading">
        <p id="order-heading">
          CURRENT ORDER ·{" "}
          <span className="difficulty">{order.difficultyBand} practice</span>
        </p>
        <strong>{order.target.toLocaleString()}</strong>
        <p>{objective}</p>
      </section>
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
              Help is optional. It does not change your shipment, but the saved
              support step is included in learning evidence.
            </p>
            <button disabled={props.saving} onClick={props.onHelp}>
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
        <p role="status">
          Device storage is unavailable. Your current draft stays in this tab,
          but it cannot be restored after refresh or close.
        </p>
      )}
      <MachineEditor
        order={order}
        quantities={props.quantities}
        quantitiesB={props.quantitiesB}
        saving={props.saving}
        setQuantities={props.setQuantities}
        setQuantitiesB={props.setQuantitiesB}
      />
      <section className="controls">
        <button
          className="secondary"
          disabled={props.saving}
          onClick={() => {
            props.setUndo(props.quantities);
            props.setQuantities([0, 0, 0, 0, 0, 0]);
          }}
        >
          Clear all
        </button>
        <button
          className="secondary"
          disabled={!props.undo || props.saving}
          onClick={() => {
            if (props.undo) props.setQuantities(props.undo);
          }}
        >
          Undo
        </button>
        <button className="ship" disabled={props.saving} onClick={props.onShip}>
          {props.saving ? "Saving…" : "Ship order"}
        </button>
        <button
          className="secondary"
          disabled={props.saving}
          onClick={props.onSkip}
        >
          Skip after two saved tries
        </button>
        <button
          className="secondary"
          disabled={props.saving}
          onClick={props.onPause}
        >
          Pause mission
        </button>
      </section>
      {props.notice && (
        <aside className="notice" role="status">
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
