import { defineConfig } from "vitest/config";
import path from "node:path";
import { loadEnv } from "vite";

// Load .env into the test environment for tests that import modules touching
// `@/env` (validated by @t3-oss/env-nextjs, Task 1.8). Real environment
// values (shell/CI) take precedence — .env files only fill gaps, so the
// filter below drops any key the process environment already defines.
// Missing vars in a bare environment fail fast with the t3 validation
// error — exactly the behavior the project wants.
const env = loadEnv("test", process.cwd(), "");
const envForTests = Object.fromEntries(
	Object.entries(env).filter(([key]) => process.env[key] === undefined),
);

export default defineConfig({
	test: {
		// Node for unit tests; DOM tests opt into jsdom via the // @vitest-environment comment.
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		env: envForTests,
		setupFiles: ["src/shared/testing/setup.ts"],
		// Coverage for entity + shared logic (Task 4.4). Run with
		// `npm run test:coverage`. The `all: false` default means only
		// files touched by tests are measured — no noisy zero-coverage
		// entries for untested UI files.
		coverage: {
			provider: "v8",
			include: [
				"src/entities/**/*.{ts,tsx}",
				"src/shared/lib/**/*.ts",
				"src/shared/schemas/**/*.ts",
				"src/shared/form/**/*.ts",
				"src/shared/form/**/*.tsx",
			],
			exclude: ["**/*.test.{ts,tsx}", "src/lib/generated/**"],
			reporter: ["text", "html"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			// `server-only` throws outside RSC builds; tests get an empty stub.
			"server-only": path.resolve(
				__dirname,
				"src/shared/testing/server-only-stub.ts",
			),
		},
	},
});
