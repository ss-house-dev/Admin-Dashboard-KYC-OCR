import * as React from "react";

/** จัดการ dock footer เมื่อ scroll (คงพฤติกรรมเดิม 1:1) */
export function useDockFooter(
  open: boolean,
  tab: string,
  // ✅ รองรับ nullable ref เพื่อเข้ากับ useRef<HTMLDivElement | null>(null)
  saRef: React.RefObject<HTMLDivElement | null>
) {
  const [dockFooter, setDockFooter] = React.useState(false);

  // scroll handling (dock footer)
  React.useEffect(() => {
    const root = saRef.current;
    if (!root) return;
    const viewport = root.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;

    const onScroll = () => setDockFooter((prev) => prev || viewport.scrollTop > 0);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [open, tab, saRef]);

  // reset dockFooter when open/tab changes
  React.useEffect(() => {
    if (open) setDockFooter(false);
  }, [open, tab]);

  return dockFooter;
}
