import type { Phase } from "./types";

export const defaultPhases: Phase[] = [
  {
    number: 1,
    name: "Phase 1",
    subtitle: "Discovery",
    description:
      "Initial market research, competitor analysis, and requirement gathering from stakeholders.",
    modules: [
      {
        id: "1",
        name: "Authentication & Identity",
        description: "Implementation of Security Features",
        roles: ["Frontend", "Backend", "DevOps"],
        workflows: [
          {
            id: "1",
            name: "User Login Flow",
            tags: ["Frontend"],
            ticketCount: 8,
            progress: 75,
          },
          {
            id: "2",
            name: "Password Reset",
            tags: ["Backend"],
            ticketCount: 3,
            progress: 30,
          },
        ],
      },
    ],
  },
  {
    number: 2,
    name: "Phase 2",
    subtitle: "Core Dev",
    description:
      "Implementation of core backend services, identity provider integration, and primary user dashboards.",
    modules: [
      {
        id: "1",
        name: "Authentication & Identity",
        description: "Implementation of Security Features",
        roles: ["Frontend", "Backend", "DevOps"],
        workflows: [
          {
            id: "1",
            name: "User Login Flow",
            tags: ["Frontend"],
            ticketCount: 8,
            progress: 75,
          },
          {
            id: "2",
            name: "Password Reset",
            tags: ["Backend"],
            ticketCount: 3,
            progress: 30,
          },
        ],
      },
    ],
  },
  {
    number: 3,
    name: "Phase 3",
    subtitle: "Production",
    description:
      "Internal beta testing, user acceptance testing, and performance optimization.",
    modules: [],
  },
];
