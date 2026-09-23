"use client";

import { useEffect, useRef, useState } from "react";
import { type EventType, track } from "@/lib/analytics";

interface TrackEventProps {
  eventType: EventType;
  metadata: Record<string, unknown>;
}

/**
 * Ghi 1 sự kiện khi mount. Chặn ghi trùng do React Strict Mode (dev) chạy
 * effect 2 lần bằng useRef; payload chụp lại ở lần render đầu (lazy init của
 * useState) nên identity ổn định, không kích effect chạy lại dù cha re-render.
 */
export function TrackEvent({ eventType, metadata }: TrackEventProps) {
  const fired = useRef(false);
  const [payload] = useState(() => ({ eventType, metadata }));

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(payload.eventType, payload.metadata);
  }, [payload]);

  return null;
}
