import { useState, useEffect, RefObject } from "react";

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

export function useMousePosition(ref?: RefObject<HTMLElement>) {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
  });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (ref?.current) {
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({
          x,
          y,
          normalizedX: x / rect.width,
          normalizedY: y / rect.height,
        });
      } else {
        setMousePosition({
          x: e.clientX,
          y: e.clientY,
          normalizedX: e.clientX / window.innerWidth,
          normalizedY: e.clientY / window.innerHeight,
        });
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [ref]);

  return mousePosition;
}
