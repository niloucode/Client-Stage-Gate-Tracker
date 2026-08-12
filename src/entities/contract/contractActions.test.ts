import { describe, expect, it } from "vitest";
import { isPdfFile } from "./contractActions";

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
