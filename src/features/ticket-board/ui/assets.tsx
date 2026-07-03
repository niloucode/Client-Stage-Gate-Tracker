/**
 * Generates up to two uppercase initials from a full name string.
 * It handles leading, trailing, and multiple consecutive spaces gracefully.
 * * @param {string} name - The full name string to extract initials from.
 * @returns {string} A 1 to 2 character uppercase string representing the name's initials.
 * * @example
 * getInitials(" john   doe ") // Returns "JD"
 * getInitials("Alice")        // Returns "A"
 */
export function getInitials(name: string): string {
    return name
        .trim()                        // Remove trailing/leading spaces
        .split(/\s+/)                  // Split into words by any spacing
        .map((word) => word[0])        // Grab the first character of each word
        .slice(0, 2)                   // Keep only the first two characters
        .join("")                      // Combine them
        .toUpperCase();                // Force uppercase
}

export function CalendarIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

export function AlertTriangleIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

export function MoreHorizontalIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
        </svg>
    );
}

export function TagsIcon() {
    return (
        <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.07 10.3L15.07 4.29996C14.93 4.15996 14.74 4.07996 14.54 4.07996H3C2.59 4.07996 2.25 4.41996 2.25 4.82996V12.71C2.25 12.91 2.33 13.1 2.47 13.24L8.47 19.23C8.91 19.67 9.49 19.91 10.11 19.91C10.73 19.91 11.32 19.67 11.75 19.23L11.97 19.01C12.01 19.09 12.05 19.17 12.12 19.23C12.57 19.68 13.17 19.91 13.76 19.91C14.35 19.91 14.95 19.68 15.41 19.23L21.06 13.58C21.96 12.68 21.96 11.21 21.06 10.3H21.07ZM10.7 18.17C10.54 18.33 10.34 18.41 10.12 18.41C9.9 18.41 9.69 18.32 9.54 18.17L3.75 12.4V5.57996H10.57L16.35 11.36C16.67 11.68 16.67 12.2 16.35 12.52L10.7 18.17ZM20.01 12.52L14.36 18.17C14.04 18.49 13.51 18.49 13.19 18.17C13.12 18.1 13.05 18.06 12.96 18.02L17.4 13.58C18.3 12.67 18.3 11.2 17.4 10.3L12.68 5.57996H14.22L20 11.36C20.32 11.68 20.32 12.2 20 12.52H20.01ZM8.25 8.49996C8.25 9.18996 7.69 9.74996 7 9.74996C6.31 9.74996 5.75 9.18996 5.75 8.49996C5.75 7.80996 6.31 7.24996 7 7.24996C7.69 7.24996 8.25 7.80996 8.25 8.49996Z" fill="#000000"/>
        </svg>
    );
}

export function FilterIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

export function PlusIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

export const TAG_COLORS = [
    // row 1 — lighter/medium hues
    "#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E", "#06B6D4", "#6366F1", "#EC4899", "#8B5CF6",
    // row 2 — deeper hues
    "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0D9488", "#0284C7", "#4338CA", "#DB2777", "#7C3AED",
];

export function getPastelStyle(hex: string): { bg: string; text: string; border: string } {
    // Parse RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Pastel bg: mix heavily with white (15% color, 85% white)
    const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
    // Text: the base color itself (saturated, readable on white-ish bg)
    const text = hex;
    // Border: very light tint
    const border = `rgba(${r}, ${g}, ${b}, 0.25)`;
    return { bg, text, border };
}



export function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

export function ChevronDownIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}
export function EyeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
