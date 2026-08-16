import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import jsdoc from "eslint-plugin-jsdoc";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// Ban debug leftovers (console.log/info/debug) while keeping legit
			// error/warn logging in server actions.
			"no-console": ["error", { allow: ["error", "warn"] }],
		},
	},
	// Standalone CLI tools (scripts/*.mjs) print to stdout by design —
	// `console.log` there is the program's output, not a debug leftover.
	{
		files: ["scripts/**/*.mjs"],
		rules: {
			"no-console": "off",
		},
	},
	// Code documentation standard (2026-08-16): JSDoc consistency on app
	// code. WARNINGS until the documentation sweep
	// (docs/code-documentation-sweep.md) converges the codebase — flip to
	// "error" when the warning count reaches 0 (CONTRIBUTING §5).
	{
		files: ["src/**/*.{ts,tsx}"],
		plugins: { jsdoc },
		rules: {
			"jsdoc/require-jsdoc": [
				"warn",
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						MethodDefinition: false,
						ClassDeclaration: false,
						ArrowFunctionExpression: false,
					},
				},
			],
			"jsdoc/require-param": "warn",
			"jsdoc/require-param-name": "warn",
			"jsdoc/check-param-names": "warn",
			"jsdoc/require-returns": "warn",
			"jsdoc/check-tag-names": "warn",
			"jsdoc/check-syntax": "warn",
		},
	},
	// Feature-Sliced Design boundary enforcement (Task 1.9):
	//   app -> features -> entities -> shared
	// Higher layers may import lower layers; never the reverse.
	// Shared infra that lives outside `src/shared` (src/lib, src/components)
	// is classified as shared so it remains importable by every layer.
	{
		plugins: { boundaries },
		settings: {
			"boundaries/elements": [
				{ type: "app", pattern: "src/app/**" },
				{ type: "features", pattern: "src/features/**" },
				{ type: "entities", pattern: "src/entities/**" },
				{ type: "shared", pattern: "src/shared/**" },
				{ type: "shared", pattern: "src/lib/**" },
				{ type: "shared", pattern: "src/components/**" },
				{ type: "shared", pattern: "src/hooks/**" },
			],
		},
		rules: {
			"boundaries/dependencies": [
				"error",
				{
					default: "disallow",
					policies: [
						// app may import anything below it
						{
							from: { element: { type: "app" } },
							allow: {
								to: {
									element: {
										types: { anyOf: ["features", "entities", "shared"] },
									},
								},
							},
						},
						// features may import entities + shared
						{
							from: { element: { type: "features" } },
							allow: {
								to: { element: { types: { anyOf: ["entities", "shared"] } } },
							},
						},
						// entities may import shared only
						{
							from: { element: { type: "entities" } },
							allow: { to: { element: { type: "shared" } } },
						},
						// shared never imports anything else
						{
							from: { element: { type: "shared" } },
							allow: { to: { element: { type: "shared" } } },
						},
					],
				},
			],
		},
	},
	// Test files stay light (standard §6) — exports in tests are helpers,
	// intent is documented via test names.
	{
		files: ["**/*.test.{ts,tsx}"],
		rules: {
			"jsdoc/require-jsdoc": "off",
			"jsdoc/require-param": "off",
			"jsdoc/require-param-name": "off",
			"jsdoc/check-param-names": "off",
			"jsdoc/require-returns": "off",
			"jsdoc/check-tag-names": "off",
			"jsdoc/check-syntax": "off",
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		// Generated code — never linted
		"src/lib/generated/**",
		// Build/test outputs — never linted
		"coverage/**",
	]),
]);

export default eslintConfig;
