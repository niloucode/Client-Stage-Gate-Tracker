import type { Phase } from "./types";

export const defaultPhases: Phase[] = [
  {
    number: 1,
    name: "Discovery",
    description: "Initial market research, competitor analysis, and requirement gathering from stakeholders.",
    startDate: new Date(2026, 9, 1, 9, 0),
    endDate: new Date(2026, 9, 15, 17, 0),
    createdAt: new Date(2026, 5, 1, 10, 0),
    modules: [
      {
        id: "1",
        name: "Authentication & Identity",
        startDate: new Date(2026, 9, 12, 9, 0),
        endDate: new Date(2026, 10, 5, 17, 0),
        createdAt: new Date(2026, 5, 7, 18, 7),
        workflows: [
          {
            id: "1",
            name: "User Login Flow",
            startDate: new Date(2026, 9, 15, 10, 0),
            endDate: new Date(2026, 9, 30, 17, 0),
            createdAt: new Date(2026, 5, 7, 18, 10),
            ticketCount: 8,
            progress: 75,
          },
          {
            id: "2",
            name: "Password Reset",
            startDate: new Date(2026, 9, 20, 9, 0),
            endDate: new Date(2026, 10, 1, 16, 0),
            createdAt: new Date(2026, 5, 8, 10, 30),
            ticketCount: 3,
            progress: 30,
          },
        ],
      },
    ],
  },
  {
    number: 2,
    name: "Core Dev",
    description: "Implementation of core backend services, identity provider integration, and primary user dashboards.",
    startDate: new Date(2026, 9, 16, 9, 0),
    endDate: new Date(2026, 10, 15, 17, 0),
    createdAt: new Date(2026, 5, 1, 11, 0),
    modules: [],
  },
  {
    number: 3,
    name: "Production",
    description: "Internal beta testing, user acceptance testing, and performance optimization.",
    startDate: new Date(2026, 10, 16, 9, 0),
    endDate: new Date(2026, 11, 15, 17, 0),
    createdAt: new Date(2026, 5, 1, 12, 0),
    modules: [],
  },
];