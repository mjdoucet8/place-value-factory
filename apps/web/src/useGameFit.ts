import { useLayoutEffect, type RefObject } from "react";

/** Fit the live HTML stage, including messages and controls, inside the screen. */
export function useGameFit(
  viewportRef: RefObject<HTMLDivElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  paused: boolean,
) {
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage || paused) return;
    window.scrollTo(0, 0);
    const fit = () => {
      const available = Math.max(
        1,
        (window.visualViewport?.height ?? window.innerHeight) -
          viewport.getBoundingClientRect().top,
      );
      viewport.style.height = `${available}px`;
      const scale = Math.min(1, available / Math.max(1, stage.scrollHeight));
      stage.style.transform = `scale(${scale})`;
      stage.style.left = `${(viewport.clientWidth - stage.offsetWidth * scale) / 2}px`;
      viewport.dataset.scale = String(scale);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    observer.observe(viewport);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, [paused, viewportRef, stageRef]);
}
