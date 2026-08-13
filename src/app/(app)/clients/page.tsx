// src/app/(app)/clients/page.tsx

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  User,
  Pencil,
  Eye,
  EyeOff,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/entities/client";
import ClientFormModal from "@/features/client-manager/ui/ClientFormModal";
import ViewTeamMembersModal from "@/features/client-manager/ui/ViewTeamMembersModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  billingAddress: string;
  companyCode: string;
  tin: string;
  profiles?: { profile_id: string; first_name: string; last_name: string; email: string; phone: string | null }[];
}

type SortField = "name" | "tin" | "email" | "contactNumber" | "billingAddress";
type SortDirection = "asc" | "desc";

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ClientHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold tracking-wide text-foreground">
        Clients
      </h1>
      <p className="subtitle">
        View the clients your company is working with.
      </p>
    </div>
  );
}

interface ClientToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClient: () => void;
}

function ClientToolbar({ searchQuery, onSearchChange, onAddClient }: ClientToolbarProps) {
  return (
    <div className="mb-5 flex gap-6 justify-between items-center max-h-10">
      <div className="flex w-[749px] items-center gap-2 rounded-md border border-border bg-neutral-surface px-4 py-2">
        <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for client name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0"
        />
      </div>
      <Button className="flex items-center gap-3" onClick={onAddClient}>
        <Plus size={14} strokeWidth={3} />
        Add Client
      </Button>
    </div>
  );
}

interface ClientTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => React.ReactNode;
}

function ClientTableHeader({ sortField, sortDirection, onSort, getSortIcon }: ClientTableHeaderProps) {
  const columns: { key: SortField; label: string; width: string }[] = [
    { key: "name", label: "CLIENT NAME", width: "w-[22%]" },
    { key: "tin", label: "TIN", width: "w-[14%]" },
    { key: "email", label: "EMAIL", width: "w-[18%]" },
    { key: "contactNumber", label: "CONTACT", width: "w-[15%]" },
    { key: "billingAddress", label: "BILLING ADDRESS", width: "w-[12%]" },
  ];

  return (
    <thead className="sticky top-0 z-10 border-b border-brand-100/50 bg-neutral-subtle text-[11px] font-normal uppercase text-muted-foreground">
      <tr>
        {columns.map((col) => (
          <th key={col.key} className={`${col.width} px-6 py-3`}>
            <button
              type="button"
              onClick={() => onSort(col.key)}
              className="flex items-center gap-1 text-[11px] font-normal uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <span>{col.label}</span>
              {getSortIcon(col.key)}
            </button>
          </th>
        ))}
        <th className="w-[10%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">COMPANY CODE</th>
        <th className="w-[8%] px-6 py-3 text-[11px] font-normal uppercase text-muted-foreground">ACTIONS</th>
      </tr>
    </thead>
  );
}

interface ClientRowProps {
  client: Client;
  isCodeVisible: boolean;
  onToggleCode: (id: string) => void;
  onViewMembers: (client: Client) => void;
  onEdit: (client: Client) => void;
}

function ClientRow({
  client,
  isCodeVisible,
  onToggleCode,
  onViewMembers,
  onEdit,
}: ClientRowProps) {
  return (
    <tr className="transition-colors hover:bg-muted/50">
      <td className="px-6 py-3.5 align-middle text-[13px] font-normal text-foreground whitespace-pre-line">
        {client.name}
      </td>
      <td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
        {client.tin}
      </td>
      <td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
        {client.email}
      </td>
      <td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground break-all">
        {client.contactNumber}
      </td>
      <td className="px-6 py-3.5 align-middle text-[13px] font-normal text-muted-foreground whitespace-pre-line">
        {client.billingAddress}
      </td>
      <td className="px-6 py-3.5 align-middle">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[13px] font-normal text-muted-foreground">
            {isCodeVisible ? client.companyCode : "••••••"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleCode(client.id)}
            aria-label={isCodeVisible ? "Hide code" : "Show code"}
          >
            {isCodeVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </td>
      <td className="px-6 py-3.5 align-middle">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onViewMembers(client)}
            aria-label="View team members"
            className="rounded-full"
          >
            <User className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(client)}
            aria-label="Edit client"
            className="rounded-full"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface ClientTableProps {
  clients: Client[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  visibleCodes: Record<string, boolean>;
  onToggleCode: (id: string) => void;
  onViewMembers: (client: Client) => void;
  onEdit: (client: Client) => void;
}

function ClientTable({
  clients,
  sortField,
  sortDirection,
  onSort,
  visibleCodes,
  onToggleCode,
  onViewMembers,
  onEdit,
}: ClientTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40 hover:opacity-100" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 shrink-0 text-brand-600" />
    ) : (
      <ChevronDown className="h-3 w-3 shrink-0 text-brand-600" />
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-brand-100 bg-neutral-surface">
      <div className="max-h-[calc(60vh)] overflow-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <ClientTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            getSortIcon={getSortIcon}
          />
          <tbody className="divide-y divide-brand-100/50 bg-neutral-surface">
            {clients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isCodeVisible={!!visibleCodes[client.id]}
                onToggleCode={onToggleCode}
                onViewMembers={onViewMembers}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ClientPage() {
  const { data: clientsData, refetch } = useClients();

  const clients: Client[] = (clientsData ?? []).map((c) => ({
    id: c.client_id,
    name: c.client_name,
    email: c.email ?? "",
    contactNumber: c.phone ?? "",
    billingAddress: c.billing_address,
    companyCode: "",
    tin: c.tin,
    profiles: c.Profiles,
  }));

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMembersClient, setViewMembersClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const toggleCode = (id: string) =>
    setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [clients, searchQuery]
  );

  const sortedClients = useMemo(() => {
    const sorted = [...filteredClients];
    sorted.sort((a, b) => {
      let aVal: string = "";
      let bVal: string = "";
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "tin":
          aVal = a.tin.toLowerCase();
          bVal = b.tin.toLowerCase();
          break;
        case "email":
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case "contactNumber":
          aVal = a.contactNumber.toLowerCase();
          bVal = b.contactNumber.toLowerCase();
          break;
        case "billingAddress":
          aVal = a.billingAddress.toLowerCase();
          bVal = b.billingAddress.toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredClients, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <>
      <main className="flex flex-1 flex-col overflow-hidden">
        <ClientHeader />

        <ClientToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClient={() => setShowAddModal(true)}
        />

        <ClientTable
          clients={sortedClients}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          visibleCodes={visibleCodes}
          onToggleCode={toggleCode}
          onViewMembers={setViewMembersClient}
          onEdit={setEditClient}
        />
      </main>

      <ClientFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          void refetch();
        }}
      />
      <ViewTeamMembersModal
        isOpen={viewMembersClient !== null}
        members={viewMembersClient?.profiles?.map((p) => ({
          id: p.profile_id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          phone: p.phone,
        }))}
        onClose={() => setViewMembersClient(null)}
      />
      <ClientFormModal
        isOpen={editClient !== null}
        clientId={editClient?.id}
        initialData={{
          clientName: editClient?.name,
          tin: editClient?.tin,
          email: editClient?.email,
          contactNumber: editClient?.contactNumber,
          billingAddress: editClient?.billingAddress,
        }}
        onClose={() => {
          setEditClient(null);
          void refetch();
        }}
      />
    </>
  );
}