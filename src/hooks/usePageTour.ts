import { useEffect, useCallback, useRef } from "react";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import { isTourDone, markTourDone } from "@/lib/tour";

const TOUR_CONFIG = {
  showProgress: true,
  progressText: "{{current}} / {{total}}",
  nextBtnText: "Lanjut →",
  prevBtnText: "← Kembali",
  doneBtnText: "Paham! 👍",
  allowClose: true,
  overlayOpacity: 0.55,
  smoothScroll: true,
};

/**
 * Auto-starts a page-specific tour on first visit.
 * Returns `startTour` for manual re-trigger (e.g. from a help button).
 */
export function usePageTour(steps: DriveStep[], storageKey: string) {
  const started = useRef(false);

  const startTour = useCallback(() => {
    const driverObj = driver({
      ...TOUR_CONFIG,
      steps,
      onDestroyed: () => markTourDone(storageKey),
    });
    driverObj.drive();
  }, [steps, storageKey]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (isTourDone(storageKey)) return;
    const t = setTimeout(startTour, 700);
    return () => clearTimeout(t);
  }, [startTour, storageKey]);

  return { startTour };
}
