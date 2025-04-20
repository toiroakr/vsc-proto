import { describe, it } from "vitest";
import { sync } from "../../src/main";
import { assert, setupTestCase } from "../helpers";

const test = (caseNo: number) => async () => {
	const testCase = { function: "sync", case: caseNo };
	await sync(await setupTestCase(testCase));
	await assert(testCase);
};

describe("sync", () => {
	it("case1: basic merge of project and local settings", test(1));
	it("case2: merge with overlapping settings", test(2));
	it("case3: merge with nested settings", test(3));
	it("case4: merge with array settings", test(4));
	it("case5: merge with complex nested settings", test(5));
	// new clone scenario
	it("case6: only settings-project.json exists", test(6));
	// integration scenario for existing projects
	it("case7: settings.json differs from settings-project.json", test(7));
});
