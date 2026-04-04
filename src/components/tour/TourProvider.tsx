"use client";
import { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  mainTourSteps,
  boardTourSteps,
  TOUR_MAIN_KEY,
  TOUR_BOARD_KEY,
  isTourDone,
  markTourDone,
} from "@/lib/tour";

interface TourContextValue {
  startMainTour: () => void;
  startBoardTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  startMainTour: () => {},
  startBoardTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const mainStarted = useRef(false);

  const startMainTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Lanjut →",
      prevBtnText: "← Kembali",
      doneBtnText: "Selesai 🎉",
      allowClose: true,
      overlayOpacity: 0.55,
      smoothScroll: true,
      steps: mainTourSteps,
      onDestroyed: () => markTourDone(TOUR_MAIN_KEY),
    });
    driverObj.drive();
  }, []);

  const startBoardTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Lanjut →",
      prevBtnText: "← Kembali",
      doneBtnText: "Paham! 🚀",
      allowClose: true,
      overlayOpacity: 0.55,
      smoothScroll: true,
      steps: boardTourSteps,
      onDestroyed: () => markTourDone(TOUR_BOARD_KEY),
    });
    driverObj.drive();
  }, []);

  // Auto-start main tour on first visit
  useEffect(() => {
    if (mainStarted.current) return;
    mainStarted.current = true;
    if (isTourDone(TOUR_MAIN_KEY)) return;

    // Small delay so sidebar/layout finishes rendering
    const t = setTimeout(() => startMainTour(), 800);
    return () => clearTimeout(t);
  }, [startMainTour]);

  return (
    <TourContext.Provider value={{ startMainTour, startBoardTour }}>
      {children}
    </TourContext.Provider>
  );
}
