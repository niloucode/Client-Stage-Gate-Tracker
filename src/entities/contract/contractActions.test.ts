import { afterEach, describe, expect, it, vi } from "vitest";
import { isPdfFile } from "./contractActions";

vi.mock("@/lib/prisma", () => ({
	prisma: { contracts: { findMany: vi.fn() } },
}));

import { getContractsByProjectOwnerId } from "./contractActions";
import { prisma } from "@/lib/prisma";

const findManyMock = vi.mocked(prisma.contracts.findMany);

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Server-side PDF magic-byte sniffing (Task 2.7): a file is accepted only
 * when its first five bytes are "%PDF-" — regardless of the browser-
 * reported `file.type`, which is client-controlled metadata.
 */

function makeFile(bytes: number[], name = "doc.pdf", type = "application/pdf"): File {
	return new File([new Uint8Array(bytes)], name, { type });
}

describe("isPdfFile", () => {
	it("accepts a file whose magic bytes are %PDF-", async () => {
		const file = makeFile([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
		expect(await isPdfFile(file)).toBe(true);
	});

	it("rejects a file that is too short", async () => {
		const file = makeFile([0x25, 0x50, 0x44]);
		expect(await isPdfFile(file)).toBe(false);
	});

	it("rejects a spoofed file even when file.type claims PDF", async () => {
		// HTML content, but the client declares application/pdf.
		const file = makeFile(
			[0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45],
			"fake.pdf",
			"application/pdf",
		);
		expect(await isPdfFile(file)).toBe(false);
	});

	it("rejects a real MIME type whose bytes are not PDF", async () => {
		// PNG magic bytes with a PDF label.
		const png = [0x89, 0x50, 0x4e, 0x47, 0x0d];
		expect(await isPdfFile(makeFile(png, "img.pdf", "application/pdf"))).toBe(
			false,
		);
	});
});

describe("getContractsByProjectOwnerId", () => {
	it("filters contracts through Projects -> RoleAssignments -> Roles", async () => {
		const contract = { contract_id: "c1" };
		findManyMock.mockResolvedValue([contract] as never);

		const result = await getContractsByProjectOwnerId("profile-1");

		expect(result).toEqual({ success: true, data: [contract] });
		expect(findManyMock).toHaveBeenCalledWith({
			where: {
				is_deleted: false,
				Projects: {
					RoleAssignments: {
						some: {
							user_id: "profile-1",
							Roles: {
								name: "Project Owner",
							},
						},
					},
				},
			},
			include: {
				Projects: {
					select: {
						name: true,
					},
				},
			},
		});
	});

	it("returns an error when no profile ID is provided", async () => {
		const result = await getContractsByProjectOwnerId("");

		expect(result).toEqual({
			success: false,
			error: "No profile ID provided.",
		});
		expect(findManyMock).not.toHaveBeenCalled();
	});
});
