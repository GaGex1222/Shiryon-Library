import { useLayoutEffect, useRef, useState } from "react";

/** רוחב אלמנט לחישובי layout רספונסיביים (מדפים וכו׳). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.clientWidth);

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("orientationchange", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return { ref, width };
}
