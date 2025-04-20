import fs from "fs-extra";
import { compare } from "dir-compare";
import path from "node:path";
import { expect } from "vitest";
import ml from "multiline-ts";

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
		asis: path.join(casePath, "asis"),
		sandbox: path.join(casePath, "sandbox"),
		tobe: path.join(casePath, "tobe"),
	};
}

export async function setupTestCase(testCase: TestCase) {
	const paths = createPaths(testCase);

	await fs.remove(paths.sandbox);
	await fs.copy(paths.asis, paths.sandbox);

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
	const result = await compare(paths.sandbox, paths.tobe, {
		compareContent: true,
	});
	expect(
		result.same,
		ml`
    Check difference between ${paths.sandbox} and ${paths.tobe}.
    Recommend using the "Choose 2 Folders and Compare" feature of the VSCode extension "Compare Folders.
    `,
	).toBe(true);
}
