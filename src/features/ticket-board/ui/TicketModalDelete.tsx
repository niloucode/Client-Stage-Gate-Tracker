/**
 * An overlay modal dialog that prompts the user to confirm or cancel a ticket deletion.
 * It blocks background interactions and stops event propagation to prevent triggering
 * underlying click handlers.
 * * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls the visibility state of the modal.
 * @param {() => void} props.onClose - Callback triggered when the user cancels or closes the modal.
 * @param {() => void} props.onConfirm - Callback triggered when the user explicitly confirms deletion.
 * @param {string} props.ticketTitle - The display name of the ticket being targeted for deletion.
 * @returns {JSX.Element | null} The rendered modal component, or null if `isOpen` is false.
 */
export default function TicketModalDelete(
    {
        isOpen,
        onClose,
        onConfirm,
        ticketTitle
    }: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
        ticketTitle: string;
    }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
    onClick={(e) => e.stopPropagation()}
>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket?</h3>
        <p className="text-sm text-gray-500 mb-6">
        Are you sure you want to delete <span className="font-medium text-gray-700">{ticketTitle}</span>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
    <button
        onClick={onClose}
    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
        Cancel
        </button>
        <button
    onClick={onConfirm}
    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
        Delete
        </button>
        </div>
        </div>
        </div>
);
}