import { describe, it } from "vitest";
import { init } from "../../src/main";
import { assert, setupTestCase } from "../helpers";

const test = (caseNo: number) => async () => {
	const testCase = { function: "init", case: caseNo };
	await init(await setupTestCase(testCase));
	await assert(testCase);
};

describe("init", () => {
	it("case1: init from empty", test(1));
	it("case2: settings.json already exists", test(2));
	it(
		"case3: settings.json and settings-project.json exist with different content",
		test(3),
	);
	it("case4: .gitignore exists with partial entries", test(4));
	it("case5: settings-local.json already exists", test(5));
	it("case6: settings.json has complex nested settings", test(6));
});
