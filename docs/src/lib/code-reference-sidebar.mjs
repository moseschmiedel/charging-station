import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const CODE_REFERENCE_ROOT = path.join(process.cwd(), "src", "code-reference");

const PROJECT_TITLES = {
	master: "Master",
	slave: "Slave",
	ir_meter: "IR Meter",
	motor: "Motor",
	dezibot: "Dezibot",
};

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
	trimValues: true,
	parseTagValue: false,
	parseAttributeValue: false,
	textNodeName: "#text",
});

function asArray(value) {
	if (value === undefined || value === null) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
}

function getRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value;
}

function getAttr(value, key) {
	const record = getRecord(value);
	if (!record) {
		return "";
	}
	const attr = record[key];
	if (attr === undefined || attr === null) {
		return "";
	}
	return String(attr);
}

function parseXmlFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	try {
		return getRecord(parser.parse(fs.readFileSync(filePath, "utf-8")));
	} catch {
		return null;
	}
}

function deriveRouteParts(project, sourcePath) {
	const normalized = sourcePath.replace(/\\/g, "/").replace(/^\.?\//, "");
	const projectPrefix = `${project}/`;
	const relative = normalized.startsWith(projectPrefix)
		? normalized.slice(projectPrefix.length)
		: normalized;

	if (relative.startsWith("src/")) {
		const afterSrc = relative.slice(4);
		if (afterSrc.includes("/")) {
			const [module, ...restParts] = afterSrc.split("/");
			const fileRemainder = restParts.join("/");
			return {
				module,
				fileRemainder,
				fileSlug: fileRemainder.replace(/\//g, "__"),
			};
		}

		return {
			module: "src",
			fileRemainder: afterSrc,
			fileSlug: afterSrc.replace(/\//g, "__"),
		};
	}

	return {
		module: "root",
		fileRemainder: relative,
		fileSlug: relative.replace(/\//g, "__"),
	};
}

function mergeKeyForFile(fileRemainder) {
	const extension = path.posix.extname(fileRemainder).toLowerCase();
	if (extension !== ".h" && extension !== ".cpp") {
		return null;
	}
	return fileRemainder.slice(0, -extension.length);
}

function mergeHeaderAndSourcePairs(files) {
	const grouped = new Map();
	const passthrough = [];

	for (const file of files) {
		const mergeKey = mergeKeyForFile(file.fileRemainder);
		if (!mergeKey) {
			passthrough.push(file);
			continue;
		}

		const key = `${file.project}|${file.module}|${mergeKey}`;
		if (!grouped.has(key)) {
			grouped.set(key, []);
		}
		grouped.get(key).push(file);
	}

	const mergedFiles = [...passthrough];
	for (const [groupKey, groupFiles] of grouped.entries()) {
		const hasHeader = groupFiles.some(
			(item) => path.posix.extname(item.fileRemainder).toLowerCase() === ".h",
		);
		const hasSource = groupFiles.some(
			(item) => path.posix.extname(item.fileRemainder).toLowerCase() === ".cpp",
		);

		if (!hasHeader || !hasSource) {
			mergedFiles.push(...groupFiles);
			continue;
		}

		const representative = groupFiles[0];
		const mergeBase = groupKey.split("|").at(-1) ?? representative.fileRemainder;
		const sourcePaths = Array.from(
			new Set(groupFiles.flatMap((item) => item.sourcePaths)),
		).sort((left, right) => left.localeCompare(right, "en"));

		mergedFiles.push({
			project: representative.project,
			module: representative.module,
			fileRemainder: mergeBase,
			fileSlug: mergeBase.replace(/\//g, "__"),
			sourcePaths,
		});
	}

	return mergedFiles;
}

function hasNestedSrcFolders(project, files) {
	const projectPrefix = `${project}/`;
	return files.some((fileDoc) =>
		fileDoc.sourcePaths.some((sourcePath) => {
			const normalized = sourcePath.replace(/\\/g, "/").replace(/^\.?\//, "");
			const relative = normalized.startsWith(projectPrefix)
				? normalized.slice(projectPrefix.length)
				: normalized;
			if (!relative.startsWith("src/")) {
				return false;
			}
			return relative.slice(4).includes("/");
		}),
	);
}

function splitFlatSrcIntoPerFileModules(project, files) {
	if (hasNestedSrcFolders(project, files)) {
		return files;
	}

	return files.map((fileDoc) => {
		if (fileDoc.module !== "src") {
			return fileDoc;
		}
		return {
			...fileDoc,
			module: fileDoc.fileRemainder.replace(/\//g, "__"),
		};
	});
}

function moduleSortKey(module) {
	if (module === "src") {
		return [0, module];
	}
	if (module === "root") {
		return [2, module];
	}
	return [1, module];
}

function loadProject(project) {
	const xmlRoot = path.join(CODE_REFERENCE_ROOT, project, "xml");
	const indexDoc = parseXmlFile(path.join(xmlRoot, "index.xml"));
	const index = getRecord(indexDoc?.doxygenindex);

	const parsedFiles = [];
	for (const compound of asArray(index?.compound)) {
		if (getAttr(compound, "kind") !== "file") {
			continue;
		}
		const refid = getAttr(compound, "refid");
		if (!refid) {
			continue;
		}

		const fileDoc = parseXmlFile(path.join(xmlRoot, `${refid}.xml`));
		const compounddef = getRecord(getRecord(fileDoc?.doxygen)?.compounddef);
		if (!compounddef) {
			continue;
		}
		const sourcePath = getAttr(compounddef.location, "file");
		if (!sourcePath) {
			continue;
		}

		const route = deriveRouteParts(project, sourcePath);
		const normalizedSourcePath = sourcePath.replace(/\\/g, "/");
		parsedFiles.push({
			project,
			module: route.module,
			fileRemainder: route.fileRemainder,
			fileSlug: route.fileSlug,
			sourcePaths: [normalizedSourcePath],
		});
	}

	const files = splitFlatSrcIntoPerFileModules(
		project,
		mergeHeaderAndSourcePairs(parsedFiles),
	);

	const modules = new Map();
	for (const fileDoc of files) {
		if (!modules.has(fileDoc.module)) {
			modules.set(fileDoc.module, []);
		}
		modules.get(fileDoc.module).push(fileDoc);
	}

	const moduleEntries = Array.from(modules.entries()).map(([module, moduleFiles]) => {
		moduleFiles.sort((left, right) =>
			left.fileRemainder.localeCompare(right.fileRemainder, "en", {
				sensitivity: "base",
			}),
		);
		return { module, files: moduleFiles };
	});

	moduleEntries.sort((left, right) => {
		const [leftRank, leftName] = moduleSortKey(left.module);
		const [rightRank, rightName] = moduleSortKey(right.module);
		return leftRank - rightRank || leftName.localeCompare(rightName, "en");
	});

	return {
		project,
		title: PROJECT_TITLES[project] ?? project,
		modules: moduleEntries,
	};
}

function fileLabel(module, fileRemainder) {
	if (module === "src" || module === "root" || module === fileRemainder) {
		return fileRemainder;
	}
	return `${module}/${fileRemainder}`;
}

export function getCodeReferenceSidebarItems() {
	if (!fs.existsSync(CODE_REFERENCE_ROOT)) {
		return [];
	}

	const projects = fs
		.readdirSync(CODE_REFERENCE_ROOT, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right, "en"));

	return projects.map((project) => {
		const summary = loadProject(project);
		const fileItems = summary.modules.flatMap((moduleSummary) =>
			moduleSummary.files.map((fileDoc) => ({
				label: fileLabel(moduleSummary.module, fileDoc.fileRemainder),
				link: `/reference/code/${encodeURIComponent(fileDoc.project)}/${encodeURIComponent(fileDoc.module)}/${encodeURIComponent(fileDoc.fileSlug)}/`,
			})),
		);

		return {
			label: summary.title,
			items: [
				{
					label: "Index",
					link: `/reference/code/${encodeURIComponent(summary.project)}/`,
				},
				...fileItems,
			],
		};
	});
}
