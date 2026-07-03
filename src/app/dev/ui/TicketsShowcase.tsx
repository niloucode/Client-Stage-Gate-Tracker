'use client';

import { useState } from 'react';
import { TicketCardContent } from '@/features/ticket-board/ui/TicketCard';
import TicketSlideOver from '@/features/ticket-board/ui/TicketModalEdit';
import TicketModalCreate from '@/features/ticket-board/ui/TicketModalCreate';
import TicketBoard from '@/features/ticket-board/ui/TicketBoard';
import { MOCK_TICKETS } from '@/features/ticket-board/model/types';
import type { Ticket } from '@/features/ticket-board/model/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-8">
      <span className="w-32 shrink-0 text-xs text-gray-400 pt-2">{label}</span>
      <div className="flex flex-wrap gap-4 flex-1">{children}</div>
    </div>
  );
}

export default function TicketsShowcase() {
  const [slideOverTicket, setSlideOverTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Four card variants from mock data
  const plainCard = MOCK_TICKETS[1];    // ASC-1030 — no assignee, no overdue
  const overdueCard = MOCK_TICKETS[0];  // ASC-1029 — overdue + red border
  const activeCard = MOCK_TICKETS[3];   // ASC-1018 — active badge + subtask bar
  const flaggedCard = MOCK_TICKETS[4];  // ASC-1027 — flagged icon

  return (
    <>
      {/* ── Ticket Card ── */}
      <Section title="Ticket Card">
        <Row label="default">
          <div className="w-72">
            <TicketCardContent ticket={plainCard} onSelect={() => {}} />
          </div>
        </Row>
        <Row label="overdue">
          <div className="w-72">
            <TicketCardContent ticket={overdueCard} onSelect={() => {}} />
          </div>
        </Row>
        <Row label="active">
          <div className="w-72">
            <TicketCardContent ticket={activeCard} onSelect={() => {}} />
          </div>
        </Row>
        <Row label="flagged">
          <div className="w-72">
            <TicketCardContent ticket={flaggedCard} onSelect={() => {}} />
          </div>
        </Row>
      </Section>

      {/* ── Ticket Board ── */}
      <Section title="Ticket Board">
        <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ height: 560 }}>
          <TicketBoard project_id="demo" workflow_id="sprint-1" />
        </div>
      </Section>

      {/* ── Ticket Slide Over ── */}
      <Section title="Ticket Slide Over">
        <Row label="preview">
          <button
            onClick={() => setSlideOverTicket(MOCK_TICKETS[5])}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Open Slide Over →
          </button>
        </Row>
        <Row label="overdue ticket">
          <button
            onClick={() => setSlideOverTicket(MOCK_TICKETS[0])}
            className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Open with overdue ticket →
          </button>
        </Row>
      </Section>

      {/* ── Create Ticket Modal ── */}
      <Section title="Create Ticket Modal">
        <Row label="preview">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Open Modal →
          </button>
        </Row>
      </Section>

      {/* Portals rendered outside normal flow */}
      <TicketSlideOver
        ticket={slideOverTicket}
        isOpen={!!slideOverTicket}
        onClose={() => setSlideOverTicket(null)}
      />
      <TicketModalCreate
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateTicket={() => setModalOpen(false)}
      />
    </>
  );
}
