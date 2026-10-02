# Stable shipment layout — 2 October 2026

The save handler added a large in-flow notice before the server replied. The viewport fitter correctly included its height, temporarily shrinking every game element. In a held-response reproduction at 1920×940, stage scale fell from 0.904716 to 0.777502. Earlier animation checks sampled departure/arrival after this notice had already disappeared, so they missed the waiting phase.

The fix uses the existing Saving… button state and removes the redundant transient notice panel. The button's status changes are politely announced. The matching saving fixture now reflects the actual screen. useGameFit, resize listeners, fitting calculations, server commands and animation sequencing are unchanged. Error and recovery feedback remain present.

Verification:

- Extended the existing real shipment check to compare stage scale and header/order/conveyor/console geometry before and during a held response. It failed before the implementation fix and passes after it.
- The held-response check resizes from 1920×940 to 1024×600 and back, confirms the Saving button fits, and confirms the original geometry is restored. Existing checks confirm that dispensers stay fixed while separate crates/fields leave and return.
- Keyboard shipment, reduced motion, eight-screen/six-state fitting, lost reply recovery, reconnect replay and takeover-reply recovery pass. The eight-check run had seven passes and one intermittent queued-tab-recovery failure; that isolated recovery check passed unchanged when rerun with tracing. No server/recovery code was altered to address this unrelated intermittent result.
- TypeScript, production build and diff checks pass. No visual baselines changed.

No live student response was submitted for verification. Existing local-development.json remains unstaged. Publication verification follows in the task log.
