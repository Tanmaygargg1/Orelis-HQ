import { useEffect } from "react";

export function broadcastRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orelis:refresh"));
  }
}

export function useRefreshListener(callback: () => void) {
  useEffect(() => {
    window.addEventListener("orelis:refresh", callback);
    return () => window.removeEventListener("orelis:refresh", callback);
  }, [callback]);
}
