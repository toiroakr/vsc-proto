#!/usr/bin/env node

import { execSync } from "node:child_process";
import { styleText, isDeepStrictEqual } from "node:util";
import path from "node:path";
import fs from "fs-extra";
import { parse } from "jsonc-parser";

async function readJsonc(filePath: string): Promise<Record<string, unknown>> {
	const content = await fs.readFile(filePath, "utf8");
	return parse(content);
}

function getPaths(dir?: string) {
	const vscodeDir =
		dir ??
		path.join(
			execSync("git rev-parse --show-toplevel").toString().trim(),
			".vscode",
		);
	return {
		vscodeDir,
		gitignorePath: path.join(vscodeDir, "..", ".gitignore"),
		settingsPath: path.join(vscodeDir, "settings.json"),
		settingsBackupPath: path.join(vscodeDir, "settings.bak.json"),
		projectSettingsPath: path.join(vscodeDir, "settings-project.jsonc"),
		localSettingsPath: path.join(vscodeDir, "settings-local.jsonc"),
	} as const;
}
type Paths = ReturnType<typeof getPaths>;

async function ensureSettings(paths: Paths): Promise<void> {
	await fs.ensureDir(paths.vscodeDir);

	// Create settings.json if it doesn't exist
	if (!(await fs.pathExists(paths.settingsPath))) {
		await fs.writeJson(paths.settingsPath, {}, { spaces: 2 });
		console.log(
			`${styleText("yellow", path.relative(process.cwd(), paths.settingsPath))} created.`,
		);
	}

	// Copy settings.json to settings-project.jsonc if it doesn't exist
	if (!(await fs.pathExists(paths.projectSettingsPath))) {
		await fs.copy(paths.settingsPath, paths.projectSettingsPath);
		console.log(
			`${styleText("yellow", path.relative(process.cwd(), paths.projectSettingsPath))} created.`,
		);
	}

	// Create settings-local.jsonc if it doesn't exist
	if (!(await fs.pathExists(paths.localSettingsPath))) {
		const settings = await readJsonc(paths.settingsPath);
		const projectSettings = await readJsonc(paths.projectSettingsPath);

		// Backup settings.json before creating settings-local.jsonc
		if (Object.keys(settings).length > 0) {
			await fs.copy(paths.settingsPath, paths.settingsBackupPath);
			console.log(
				`${styleText("yellow", path.relative(process.cwd(), paths.settingsBackupPath))} created as backup.`,
			);
		}

		const localSettings: Record<string, unknown> = {};
		for (const key in settings) {
			if (
				key in projectSettings &&
				isDeepStrictEqual(settings[key], projectSettings[key])
			) {
				continue;
			}
			localSettings[key] = settings[key];
		}
		await fs.writeJson(paths.localSettingsPath, localSettings, { spaces: 2 });
		console.log(
			`${styleText("yellow", path.relative(process.cwd(), paths.localSettingsPath))} created.`,
		);
	}
}

export async function init(vscodeDir?: string): Promise<void> {
	const paths = getPaths(vscodeDir);

	// Append entries to .gitignore
	const gitignoreEntries = [
		".vscode/settings-local.jsonc",
		"!.vscode/settings-project.jsonc",
		".vscode/settings.json",
	];
	let gitignoreContent = "";
	if (await fs.pathExists(paths.gitignorePath)) {
		gitignoreContent = await fs.readFile(paths.gitignorePath, "utf8");
	}
	for (const entry of gitignoreEntries) {
		if (!gitignoreContent.includes(entry)) {
			gitignoreContent += `${entry}\n`;
		}
	}
	await fs.writeFile(paths.gitignorePath, gitignoreContent);

	await ensureSettings(paths);

	console.log(styleText("dim", "vsc-sync initialized."));
}

export async function sync(vscodeDir?: string): Promise<void> {
	const paths = getPaths(vscodeDir);

	await ensureSettings(paths);

	const projectSettings = await readJsonc(paths.projectSettingsPath);
	const localSettings = await readJsonc(paths.localSettingsPath);

	const mergedSettings = { ...projectSettings, ...localSettings };

	await fs.writeJson(paths.settingsPath, mergedSettings, { spaces: 2 });

	console.log(
		`${styleText("yellow", path.relative(process.cwd(), paths.settingsPath))} synchronized.`,
	);
}
