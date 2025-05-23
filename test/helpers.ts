import path from "node:path";
import { compare } from "dir-compare";
import fs from "fs-extra";
import ml from "multiline-ts";
import { expect } from "vitest";

interface TestCase {
	function: string;
	case: number;
}

function createPaths(testCase: TestCase) {
	const casePath = path.join(
		import.meta.dirname,
		testCase.function,
		`case${testCase.case}`,
	);
	return {
		case: casePath,
		input: path.join(casePath, "input"),
		output: path.join(casePath, "output"),
		sandbox: path.join(casePath, "sandbox"),
	} as const;
}

export async function setupTestCase(testCase: TestCase) {
	const paths = createPaths(testCase);

	await fs.remove(paths.sandbox);
	await fs.copy(paths.input, paths.sandbox);

	const gitkeepPath = path.join(paths.sandbox, ".gitkeep");
	if (await fs.pathExists(gitkeepPath)) {
		await fs.remove(gitkeepPath);
	}

	const vscodeDir = path.join(paths.sandbox, ".vscode");
	await fs.ensureDir(vscodeDir);

	return vscodeDir;
}

export async function assert(testCase: TestCase) {
	const paths = createPaths(testCase);
	const result = await compare(paths.sandbox, paths.output, {
		compareContent: true,
	});
	expect(
		result.same,
		ml`
    Check difference between ${paths.sandbox} and ${paths.output}.
    Recommend using the "Choose 2 Folders and Compare" feature of the VSCode extension "Compare Folders.
    `,
	).toBe(true);
}
