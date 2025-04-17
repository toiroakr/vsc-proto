#!/usr/bin/env node

import { defineCommand, runMain } from "citty";
import { readPackageJSON } from "pkg-types";
import { init, sync } from "./main";

const initCommand = defineCommand({
	meta: {
		name: "init",
		description: "Initialize VS Code settings",
	},
	args: {
		dir: {
			type: "string",
			description: "VS Code settings directory",
			shortcut: "d",
		},
	},
	async run({ args }) {
		await init(args.dir);
		return 0;
	},
});

const syncCommand = defineCommand({
	meta: {
		name: "sync",
		description: "Synchronize VS Code settings",
	},
	args: {
		dir: {
			type: "string",
			description: "VS Code settings directory",
			shortcut: "d",
		},
	},
	async run({ args }) {
		await sync(args.dir);
		return 0;
	},
});

const packageJson = await readPackageJSON(import.meta.url);
const main = defineCommand({
	meta: {
		name: packageJson.name,
		version: packageJson.version,
		description: packageJson.description,
	},
	subCommands: {
		init: initCommand,
		sync: syncCommand,
	},
});

runMain(main);
