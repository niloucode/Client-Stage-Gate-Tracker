import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Hanken_Grotesk } from 'next/font/google'
import TicketsShowcase from './TicketsShowcase'

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 pb-2">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-8">
      <span className="w-32 shrink-0 text-xs text-gray-400 pt-2">{label}</span>
      <div className="flex flex-wrap gap-4 flex-1">{children}</div>
    </div>
  )
}

export default function UIPage() {
  return (
    <div className={`${hanken.className} min-h-screen bg-gray-50 px-12 py-14`}>
      <div className="max-w-3xl mx-auto">

        <div className="mb-12">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Internal</p>
          <h1 className="text-2xl font-semibold text-gray-900">Component Library</h1>
          <p className="text-sm text-gray-400 mt-1">
            All reusable UI primitives — <code className="bg-gray-100 px-1 rounded">src/components/ui/</code>
          </p>
        </div>

        {/* ── Button ── */}
        <Section title="Button">
          <Row label="primary">
            <Button variant="primary" className="w-40">Sign In</Button>
            <Button variant="primary" className="w-40" disabled>Disabled</Button>
          </Row>
          <Row label="ghost">
            <Button variant="ghost" className="w-40">Cancel</Button>
            <Button variant="ghost" className="w-40" disabled>Disabled</Button>
          </Row>
        </Section>

        {/* ── Input ── */}
        <Section title="Input">
          <Row label="default">
            <Input placeholder="name@company.com" className="max-w-xs" />
          </Row>
          <Row label="with value">
            <Input defaultValue="nate@asceoft.com" className="max-w-xs" />
          </Row>
          <Row label="password">
            <Input type="password" defaultValue="password123" className="max-w-xs" />
          </Row>
          <Row label="disabled">
            <Input placeholder="Disabled field" disabled className="max-w-xs" />
          </Row>
        </Section>

        {/* ── Label ── */}
        <Section title="Label">
          <Row label="default">
            <Label>Email Address</Label>
          </Row>
          <Row label="paired">
            <div className="flex flex-col gap-1.5 w-64">
              <Label htmlFor="demo-input">Email Address</Label>
              <Input id="demo-input" placeholder="name@company.com" />
            </div>
          </Row>
        </Section>

        {/* ── Combined ── */}
        <Section title="Combined — Form Field">
          <Row label="sign in form">
            <div className="flex flex-col gap-4 w-72">
              <div>
                <Label htmlFor="ex-email" className="mb-1.5">Email Address</Label>
                <Input id="ex-email" type="email" placeholder="name@company.com" />
              </div>
              <div>
                <Label htmlFor="ex-password" className="mb-1.5">Password</Label>
                <Input id="ex-password" type="password" defaultValue="secret" />
              </div>
              <Button variant="primary">Sign In</Button>
              <Button variant="ghost">Sign up for an account</Button>
            </div>
          </Row>
        </Section>

        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="mb-12">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Ticket Components</p>
          <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
          <p className="text-sm text-gray-400 mt-1">
            Kanban board and its sub-components — <code className="bg-gray-100 px-1 rounded">src/components/tickets/</code>
          </p>
        </div>

        <TicketsShowcase />

      </div>
    </div>
  )
}
