import { getPastelStyle } from "@/shared/lib/colors";
import type { Tag } from "@/entities/types";

export function TagBadge({
  tag,
  className = "",
  onClick,
  hover = false,
}: {
  tag: Tag;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  const { bg, text } = getPastelStyle(tag?.color ?? "#06B6D4");

  return (
    <div
      onClick={onClick}
      className={`
        group inline-grid place-items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors select-none
        ${hover ? "cursor-pointer hover:!bg-neutral-border" : ""}
        ${className}
      `}
	  style={{backgroundColor: bg }}
    >
      {/* 
        tag.name stays rendered in Grid area 1/1 to dictate width/height.
        opacity-0 keeps it occupying space without showing text.
      */}
      <span
        className={`col-start-1 row-start-1 ${
          hover ? "group-hover:opacity-0" : ""
        }`}
		style={{ color: text }}
      >
        {tag.name}
      </span>

      {/* 
        The X renders in the exact same Grid area 1/1 centered over the invisible text.
      */}
      {hover && (
        <span className="text-background col-start-1 row-start-1 opacity-0 group-hover:opacity-100 font-bold pointer-events-none">
          ✕
        </span>
      )}
    </div>
  );
}