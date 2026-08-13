import { Prisma } from "@/lib/generated/prisma";

export const ticketInclude = {
	TicketTags: true,
	TicketAssigned: {
		include: {
			Profile: {
				select: {
					first_name: true,
					last_name: true,
				},
			},
		},
	},
	Profile: {
		select: {
			first_name: true,
			last_name: true,
		},
	},
} as const;

export const dashboardTicketInclude = {
	Issues: {
		select: {
			urgency: true,
		},
	},
	TicketTags: {
		include: {
			Tags: {
				select: {
					name: true,
					color: true,
				},
			},
		},
	},
	TicketAssigned: {
		include: {
			Profile: {
				select: {
					first_name: true,
					last_name: true,
				},
			},
		},
	},
	Workflows: {
		select: {
			name: true,
			Modules: {
				select: {
					name: true,
					Phases: {
						select: {
							phase_id: true,
							number: true,
							actual_end_at: true,
							name: true,
							stage_id: true,
							is_deleted: true,
							deleted_at: true,
							description: true,
							plan_end_at: true,
							plan_start_at: true,
							actual_start_at: true,
							sort_key: true,
							Stages: {
								select: {
									stage_id: true,
									number: true,
									actual_end_at: true,
									name: true,
									project_id: true,
									is_deleted: true,
									deleted_at: true,
									description: true,
									plan_end_at: true,
									plan_start_at: true,
									actual_start_at: true,
									sort_key: true,
									Projects: {
										select: {
											name: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
} as const;

// export const ticketAssignedInclude = {
// 	Tickets: {
// 		select: {
// 			name: true,
// 			ticket_id: true,
// 			plan_end_at: true,
// 		},
// 		include: {
// 			TicketTags: true,
// 			Issues: {
// 				select: {
// 					urgency: true,
// 				},
// 			},
// 			Workflows: {
// 				select: {
// 					// number: true,
// 					name: true,
// 					// is_deleted: true,
// 					// deleted_at:   true,
// 					// actual_end_at:  true,
// 					// plan_end_at: true,
// 					// workflow_id: true,
// 					// plan_start_at: true,
// 					// actual_start_at: true,
// 					// sort_key: true,
// 					// is_approved: true,
// 					// module_id: true,
// 				},

// 				include: {
// 					Modules: {
// 						select: {
// 							name: true,
// 							// is_deleted: true,
// 							// deleted_at: true,
// 							// actual_end_at: true,
// 							// plan_end_at: true,
// 							// plan_start_at: true,
// 							// actual_start_at: true,
// 							// phase_id: true,
// 							// module_id: true,
// 						},
// 						include: {
// 							Phases: {
// 								include: {
// 									Stages: {
// 										include: {
// 											Projects: {
// 												select: {
// 													name: true,
// 													// is_deleted: true,
// 													// deleted_at: true,
// 													// actual_end_at: true,
// 													// plan_end_at: true,
// 													// description: true,
// 													// status: true,
// 													// plan_start_at: true,
// 													// actual_start_at: true,
// 													// project_id: true,
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 	},
// 	Profile: {
// 		select: {
// 			first_name: true,
// 			last_name: true,
// 		},
// 	},
// } as const;

export type TicketPayload = Prisma.TicketsGetPayload<{
	include: typeof ticketInclude;
}>;

export type DashboardTicketPayload = Prisma.TicketsGetPayload<{
	include: typeof dashboardTicketInclude;
}>;

// export type TicketAssigned = Prisma.TicketAssignedGetPayload<{
// 	include: typeof ticketAssignedInclude;
// }>;
