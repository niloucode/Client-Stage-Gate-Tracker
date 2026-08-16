import { PrismaClient, type Prisma } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

const VALID_LOG_LEVELS = ["query", "info", "warn", "error"] as const;
const DEFAULT_LOG_LEVELS: Prisma.LogLevel[] = ["error", "warn"];

/**
 * Resolve the Prisma log levels from the optional PRISMA_LOG_LEVEL env var
 * (comma-separated: query,info,warn,error). Falls back to ["error", "warn"]
 * when the var is unset, empty, or contains no valid levels. Duplicates are
 * dropped, order preserved.
 * @returns The resolved log level list.
 */
function resolveLogLevels(): Prisma.LogLevel[] {
	const raw = process.env.PRISMA_LOG_LEVEL;
	if (!raw) return DEFAULT_LOG_LEVELS;
	const levels = raw
		.split(",")
		.map((level) => level.trim().toLowerCase())
		.filter((level): level is (typeof VALID_LOG_LEVELS)[number] =>
			VALID_LOG_LEVELS.includes(level as (typeof VALID_LOG_LEVELS)[number]),
		);
	const unique = [...new Set(levels)];
	return unique.length > 0 ? unique : DEFAULT_LOG_LEVELS;
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

function createPrismaClient() {
	const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
	return new PrismaClient({
		log: resolveLogLevels(),
		adapter,
	});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
