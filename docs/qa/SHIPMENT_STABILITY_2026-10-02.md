# Stable shipment layout — 2 October 2026

The save handler added a large in-flow notice before the server replied. The viewport fitter correctly included its height, temporarily shrinking every game element. In a held-response reproduction at 1920×940, stage scale fell from 0.904716 to 0.777502. Earlier animation checks sampled departure/arrival after this notice had already disappeared, so they missed the waiting phase.

The fix uses the existing Saving… button state and removes the redundant transient notice panel. The button's status changes are politely announced. The matching saving fixture now reflects the actual screen. useGameFit, resize listeners, fitting calculations, server commands and animation sequencing are unchanged. Error and recovery feedback remain present.

Verification:

- Extended the existing real shipment check to compare stage scale and header/order/conveyor/console geometry before and during a held response. It failed before the implementation fix and passes after it.
- The held-response check resizes from 1920×940 to 1024×600 and back, confirms the Saving button fits, and confirms the original geometry is restored. Existing checks confirm that dispensers stay fixed while separate crates/fields leave and return.
- Keyboard shipment, reduced motion, eight-screen/six-state fitting, lost reply recovery, reconnect replay and takeover-reply recovery pass. The eight-check run had seven passes and one intermittent queued-tab-recovery failure; that isolated recovery check passed unchanged when rerun with tracing. No server/recovery code was altered to address this unrelated intermittent result.
- TypeScript, production build and diff checks pass. No visual baselines changed.

No live student response was submitted for verification. Existing local-development.json remains unstaged. Publication verification is recorded below.

Publication:

- Implementation: c0ecb60; READY deployment dpl_APLmeCLRftJnnPCDoeNuxiByZuBw.
- Stable URL: https://math-factory-one.vercel.app/; deployment URL: https://math-factory-5j45ltfx0-doucet.vercel.app. Remote build completed in 33 seconds.
- The initial authorization failure was resolved by refreshing the existing identical Vercel project connection; no project/account settings changed.
- Live page and /api/healthz return 200; health status is ok.
- Live JavaScript/CSS match the tested local production build byte-for-byte: index-DqnbFlcN.js SHA-256 c2d19e5c19d4a6c16de7747d5bae38490f140d8550efd745cb3f7793b3fd3cb4; index-CMy0x9EK.css SHA-256 e7075ff0d1ceebf2b6549365a602a98f201ee0c2cff6cab01ca378c989a8728b.
- Fresh Chromium at 1366×600 confirms blank credentials, visible login and no page errors. Bounded deployment error scan returned no records. No live student account or response was changed during verification.
