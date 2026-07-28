"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Search,
  User,
  Pencil,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";


// ==========================================
// 3. Main Client Component
// ==========================================

interface ClientListProps {
  onViewMembers?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onAddClient?: () => void;
}

export default function ClientPage({
  onViewMembers,
  onEditClient,
  onAddClient,
}: ClientListProps) {
  // Query state
  const { data: clients = [], isLoading, isError, error } = useClients();

  // Local UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({});

  const toggleCode = (id: string) =>
    setVisibleCodes((prev) => ({ ...prev, [id]: !prev[id] }));

  // Live search filtering
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const term = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.tin.toLowerCase().includes(term)
    );
  }, [clients, searchQuery]);

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-wide text-foreground">
          Client List
        </h1>
        <p className="mt-1 text-base text-neutral-border">
          View the clients your company is working with.
        </p>
      </div>

      <div className="mb-5 flex max-h-10 items-center justify-between">
        {/* Search Input */}
        <div
          className="flex w-[749px] items-center gap-2 rounded-full bg-neutral-surface px-4 py-2"
          style={{ border: "1px solid #c7c4d8" }}
        >
          <Search
            className="h-[18px] w-[18px] shrink-0"
            style={{ color: "#777587" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for client name, TIN, or email..."
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "#151c27" }}
          />
        </div>

        <Button
          onClick={onAddClient}
          className="flex max-w-35 items-center justify-center gap-3"
        >
          <Plus size={14} strokeWidth={3} />
          Add Client
        </Button>
      </div>

      {/* Table Container */}
      <div
        className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-surface"
        style={{ border: "1px solid #c7c4d8" }}
      >
        <div className="client-scroll max-h-[calc(60vh)] flex-1 overflow-auto">
          <div className="flex flex-col">
            {/* Table Header */}
            <div
              className="sticky top-0 z-10 grid shrink-0 items-center px-6 py-3 text-[11px] font-bold"
              style={{
                gridTemplateColumns: "226px 198px 1fr 1fr 1fr 113px 141px",
                backgroundColor: "#f8f9ff",
                borderBottom: "1px solid #c7c4d8",
                color: "#777587",
              }}
            >
              <span>CLIENT NAME</span>
              <span>TIN</span>
              <span>EMAIL</span>
              <span>CONTACT</span>
              <span>BILLING ADDRESS</span>
              <span>COMPANY CODE</span>
              <span>ACTIONS</span>
            </div>

            {/* Table Body States */}
            <div className="flex flex-col">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading clients...
                </div>
              ) : isError ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-6 w-6" />
                  <span>
                    {error instanceof Error ? error.message : "An error occurred"}
                  </span>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                  No clients found.
                </div>
              ) : (
                filteredClients.map((client, i) => (
                  <div
                    key={client.id}
                    className="grid items-center px-6 py-5 transition-colors hover:bg-gray-50"
                    style={{
                      gridTemplateColumns:
                        "226px 198px 1fr 1fr 1fr 113px 141px",
                      borderBottom:
                        i < filteredClients.length - 1
                          ? "1px solid #c7c4d8"
                          : "none",
                    }}
                  >
                    {/* Client Name */}
                    <span
                      className="whitespace-pre-line text-base font-bold"
                      style={{ color: "#151c27" }}
                    >
                      {client.name}
                    </span>

                    {/* TIN */}
                    <span className="text-base" style={{ color: "#151c27" }}>
                      {client.tin}
                    </span>

                    {/* Email */}
                    <span
                      className="truncate text-base"
                      style={{ color: "#464555" }}
                    >
                      {client.email}
                    </span>

                    {/* Contact */}
                    <span className="text-base" style={{ color: "#464555" }}>
                      {client.contactNumber}
                    </span>

                    {/* Billing Address */}
                    <span
                      className="whitespace-pre-line text-base"
                      style={{ color: "#464555" }}
                    >
                      {client.billingAddress}
                    </span>

                    {/* Company Code */}
                    <div className="flex items-center gap-2">
                      <span className="text-base" style={{ color: "#464555" }}>
                        {visibleCodes[client.id]
                          ? client.companyCode
                          : "••••••"}
                      </span>
                      <button
                        onClick={() => toggleCode(client.id)}
                        className="ml-auto mr-8 flex items-center justify-center rounded p-0.5 transition-colors hover:bg-gray-100"
                        aria-label={
                          visibleCodes[client.id] ? "Hide code" : "Show code"
                        }
                      >
                        {visibleCodes[client.id] ? (
                          <Eye className="h-4 w-4" style={{ color: "#1e1e1e" }} />
                        ) : (
                          <EyeOff className="h-4 w-4" style={{ color: "#464555" }} />
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onViewMembers?.(client)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                        aria-label="View team members"
                      >
                        <User className="h-4 w-4 text-black" />
                      </button>
                      <button
                        onClick={() => onEditClient?.(client)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                        aria-label="Edit client"
                      >
                        <Pencil className="h-4 w-4 text-black" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}