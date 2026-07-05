'use client'

import type { ReactElement } from 'react'
import { action } from '@/lib/generated/prisma'
import { useTicketHistory } from '../model/queries'
import type { TicketHistoryEntry } from '../model/types'
import {
  PlusCircleIcon,
  CheckCircleIcon,
  StatusChangeIcon,
  PencilIcon,
  MessageIcon,
} from './assets'

const ACTION_META: Record<
  action,
  { Icon: (props: { className?: string }) => ReactElement; bg: string; text: string }
> = {
  [action.CREATED]: { Icon: PlusCircleIcon, bg: 'bg-green-100', text: 'text-green-600' },
  [action.UPDATED_STATUS]: { Icon: StatusChangeIcon, bg: 'bg-blue-100', text: 'text-blue-600' },
  [action.RENAMED]: { Icon: PencilIcon, bg: 'bg-amber-100', text: 'text-amber-600' },
  [action.COMMENT_ADDED]: { Icon: MessageIcon, bg: 'bg-gray-100', text: 'text-gray-500' },
  [action.FINISHED]: { Icon: CheckCircleIcon, bg: 'bg-indigo-100', text: 'text-indigo-600' },
}

/**
 * Formats a past Date as a short relative string ("2 hours ago").
 * Falls back to a calendar date once the gap exceeds a week.
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  const thresholds: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
  ]

  let value = seconds
  for (const [limit, unit] of thresholds) {
    if (value < limit) {
      const rounded = Math.max(1, Math.floor(value))
      return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`
    }
    value /= limit
  }

  return date.toLocaleDateString()
}

function HistoryEntryRow({ entry }: { entry: TicketHistoryEntry }) {
  const { Icon, bg, text } = ACTION_META[entry.action]

  return (
    <li className="flex gap-2.5">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ${bg}`}>
        <Icon className={text} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">
          <span className="font-medium text-gray-900">{entry.performedByName}</span>{' '}
          {entry.description}
        </p>
        <p
          className="text-xs text-gray-400 mt-0.5 cursor-default"
          title={entry.date_performed.toLocaleString()}
        >
          {formatRelativeTime(entry.date_performed)}
        </p>
      </div>
    </li>
  )
}

export default function TicketHistoryLog({ ticketId }: { ticketId: string | undefined }) {
  const { data: history = [], isLoading } = useTicketHistory(ticketId)

  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading activity…</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No activity yet</p>
      ) : (
        <ol className="space-y-3">
          {history.map((entry) => (
            <HistoryEntryRow key={entry.history_event_id} entry={entry} />
          ))}
        </ol>
      )}
    </div>
  )
}
