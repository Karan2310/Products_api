"use client";

import { useCallback, useRef, type MouseEventHandler } from "react";

import { cn } from "@/lib/utils";

interface ColumnResizeHandleProps {
  onResize: (deltaX: number) => void;
  className?: string;
}

export function ColumnResizeHandle({
  onResize,
  className,
}: ColumnResizeHandleProps) {
  const startXRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (startXRef.current === null) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - startXRef.current;
      onResize(deltaX);
      startXRef.current = event.clientX;
    },
    [onResize],
  );

  const handleMouseUp = useCallback(() => {
    startXRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      startXRef.current = event.clientX;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn(
        "relative inline-block h-full w-1 cursor-col-resize select-none",
        "after:absolute after:left-1/2 after:top-1/2 after:h-5 after:w-[2px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-border",
        "hover:after:bg-primary",
        className,
      )}
      onMouseDown={handleMouseDown}
    />
  );
}
