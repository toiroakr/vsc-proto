import { describe, it, expect, vi, beforeEach } from "vitest";
import multiline from "multiline-ts";
import { init, sync } from "../src/main";

vi.mock("node:child_process", () => ({
	execSync: vi.fn().mockReturnValue(Buffer.from("git-root")),
}));

vi.mock("fs-extra", () => {
	const mockFns = {
		ensureDir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
		writeJson: vi.fn().mockResolvedValue(undefined),
		copy: vi.fn().mockResolvedValue(undefined),
		pathExists: vi.fn().mockResolvedValue(false),
		readFile: vi.fn().mockResolvedValue(""),
		readJson: vi.fn().mockResolvedValue({}),
	};
	return { default: mockFns, ...mockFns };
});

const fs = vi.mocked(await import("fs-extra")).default;
const gitignoreEntries = [
	".vscode/settings-local.json",
	"!.vscode/settings-project.json",
	".vscode/settings.json",
];
const gitignoreContent = `${gitignoreEntries.join("\n")}\n`;

describe("init function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create all files and update gitignore when no files exist", async () => {
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			return filePath.toString().includes(".gitignore");
		});
		vi.spyOn(fs, "readFile").mockImplementation(() => "");

		await init(".vscode");

		expect(fs.ensureDir).toHaveBeenCalledWith(".vscode");
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			{},
			{ spaces: 2 },
		);
		expect(fs.copy).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			expect.stringContaining("settings-project.json"),
		);
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings-local.json"),
			expect.any(Object),
			{ spaces: 2 },
		);
		expect(fs.writeFile).toHaveBeenCalledWith(
			expect.stringContaining(".gitignore"),
			expect.stringContaining(".vscode/settings.json"),
		);
	});

	it("should update gitignore with both entries when gitignore exists but is empty", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			return filePath.toString().includes(".gitignore");
		});
		vi.spyOn(fs, "readFile").mockImplementation(() => "");

		// exec
		await init(".vscode");

		// assert
		expect(fs.writeFile).toHaveBeenCalledWith(
			expect.stringContaining(".gitignore"),
			gitignoreContent,
		);
	});

	it("should add only missing entries to gitignore when some entries already exist", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			return filePath.toString().includes(".gitignore");
		});
		vi.spyOn(fs, "readFile").mockImplementation(
			() =>
				multiline`
			node_modules/
			.vscode/settings.json

			`,
		);

		// exec
		await init(".vscode");

		// assert
		expect(fs.writeFile).toHaveBeenCalledWith(
			expect.stringContaining(".gitignore"),
			multiline`
			node_modules/
			.vscode/settings.json
			.vscode/settings-local.json
			!.vscode/settings-project.json

			`,
		);
	});

	it("should not modify gitignore when all entries already exist", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			return filePath.toString().includes(".gitignore");
		});
		vi.spyOn(fs, "readFile").mockImplementation(
			() =>
				multiline`
			.vscode/settings.json
			.vscode/settings-local.json
			!.vscode/settings-project.json

			`,
		);

		// exec
		await init(".vscode");

		// assert
		expect(fs.writeFile).toHaveBeenCalledWith(
			expect.stringContaining(".gitignore"),
			multiline`
			.vscode/settings.json
			.vscode/settings-local.json
			!.vscode/settings-project.json

			`,
		);
	});

	it("should only create missing files when some files exist", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			return path.includes("settings.json") || path.includes(".gitignore");
		});
		vi.spyOn(fs, "readJson").mockResolvedValue({ "editor.formatOnSave": true });

		// exec
		await init(".vscode");

		// assert
		expect(fs.writeJson).not.toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			expect.any(Object),
			expect.any(Object),
		);
		expect(fs.copy).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			expect.stringContaining("settings-project.json"),
		);
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings-local.json"),
			expect.any(Object),
			{ spaces: 2 },
		);
	});

	it("should not overwrite existing files when all files exist", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async () => true);
		vi.spyOn(fs, "readJson").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			if (
				path.includes("settings.json") ||
				path.includes("settings-project.json")
			) {
				return { "editor.formatOnSave": true };
			}
			return {};
		});

		// exec
		await init(".vscode");

		// assert
		expect(fs.writeJson).not.toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			expect.any(Object),
			expect.any(Object),
		);
		expect(fs.copy).not.toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			expect.stringContaining("settings-project.json"),
		);
		expect(fs.writeJson).not.toHaveBeenCalledWith(
			expect.stringContaining("settings-local.json"),
			expect.any(Object),
			expect.any(Object),
		);
	});
});

describe("sync function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should merge settings correctly when all files exist", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async () => true);
		vi.spyOn(fs, "readJson").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			if (path.includes("settings-project.json")) {
				return { "editor.tabSize": 2 };
			}
			if (path.includes("settings-local.json")) {
				return { "editor.formatOnSave": true };
			}
			return {};
		});

		// exec
		await sync(".vscode");

		// assert
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			{ "editor.tabSize": 2, "editor.formatOnSave": true },
			{ spaces: 2 },
		);
	});

	it("should create missing files before syncing", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			return !filePath.toString().includes("settings-local.json");
		});
		vi.spyOn(fs, "readJson").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			if (
				path.includes("settings-project.json") ||
				path.includes("settings.json")
			) {
				return { "editor.tabSize": 2 };
			}
			return {};
		});

		// exec
		await sync(".vscode");

		// assert
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings-local.json"),
			expect.any(Object),
			{ spaces: 2 },
		);
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			{ "editor.tabSize": 2 },
			{ spaces: 2 },
		);
	});

	it("should prioritize local settings over project settings", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async () => true);
		vi.spyOn(fs, "readJson").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			if (path.includes("settings-project.json")) {
				return { "editor.tabSize": 2, "editor.fontSize": 14 };
			}
			if (path.includes("settings-local.json")) {
				return { "editor.tabSize": 4 };
			}
			return {};
		});

		// exec
		await sync(".vscode");

		// assert
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			{ "editor.tabSize": 4, "editor.fontSize": 14 },
			{ spaces: 2 },
		);
	});

	it("retain local settings as much as possible in first sync", async () => {
		// prepare
		vi.spyOn(fs, "pathExists").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			return !path.includes("settings-local.json");
		});
		vi.spyOn(fs, "readJson").mockImplementation(async (filePath) => {
			const path = filePath.toString();
			if (path.includes("settings.json")) {
				return {
					"editor.formatOnSave": true,
					"editor.tabSize": 2,
					"editor.fontSize": 14,
				};
			}
			if (path.includes("settings-project.json")) {
				return {
					"editor.tabCompletion": "on",
					"editor.tabSize": 2,
					"editor.fontSize": 12,
				};
			}
			if (path.includes("settings-local.json")) {
				return { "editor.formatOnSave": true, "editor.fontSize": 14 };
			}
			return {};
		});

		// exec
		await sync(".vscode");

		// assert
		expect(fs.writeJson).toHaveBeenCalledTimes(2);
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings-local.json"),
			{ "editor.formatOnSave": true, "editor.fontSize": 14 },
			{ spaces: 2 },
		);
		expect(fs.writeJson).toHaveBeenCalledWith(
			expect.stringContaining("settings.json"),
			{
				"editor.tabCompletion": "on",
				"editor.formatOnSave": true,
				"editor.tabSize": 2,
				"editor.fontSize": 14,
			},
			{ spaces: 2 },
		);
	});
});
