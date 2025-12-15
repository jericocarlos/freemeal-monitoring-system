import { useEffect } from "react";

export function useF2Shortcut(callback, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      // Use BOTH for reliability
      if (e.key === "F2" || e.code === "F2") {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}

export default useF2Shortcut;
