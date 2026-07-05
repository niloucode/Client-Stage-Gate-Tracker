export const TAG_COLORS = [
    // row 1 — lighter/medium hues
    "#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E", "#06B6D4", "#6366F1", "#EC4899", "#8B5CF6",
    // row 2 — deeper hues
    "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0D9488", "#0284C7", "#4338CA", "#DB2777", "#7C3AED",
];

export function getPastelStyle(hex: string): { bg: string; text: string; border: string } {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
    const text = hex;
    const border = `rgba(${r}, ${g}, ${b}, 0.25)`;
    return { bg, text, border };
}
