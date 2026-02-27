import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const CODE_REFERENCE_ROOT = path.join(process.cwd(), "src", "code-reference");

const PROJECT_TITLES: Record<string, string> = {
  master: "Master",
  slave: "Slave",
  ir_meter: "IR Meter",
  motor: "Motor",
  dezibot: "Dezibot",
};

type UnknownRecord = Record<string, unknown>;

export interface CodeFunctionDoc {
  name: string;
  signature: string;
  brief: string;
  location: string;
  qualifiers: string[];
  args: CodeFunctionArg[];
}

export interface CodeFunctionArg {
  name: string;
  type: string;
  defaultValue: string;
  typeHref?: string;
  typeLinkToken?: string;
}

export interface CodeClassDoc {
  refid: string;
  name: string;
  kind: string;
  brief: string;
  location: string;
  methods: CodeFunctionDoc[];
}

export interface CodeFileDoc {
  project: string;
  projectTitle: string;
  module: string;
  fileSlug: string;
  fileName: string;
  fileRemainder: string;
  sourcePath: string;
  sourcePaths: string[];
  refid: string;
  refids: string[];
  brief: string;
  functions: CodeFunctionDoc[];
  classes: CodeClassDoc[];
}

export interface CodeModuleSummary {
  project: string;
  projectTitle: string;
  module: string;
  files: CodeFileDoc[];
}

export interface CodeProjectSummary {
  project: string;
  title: string;
  modules: CodeModuleSummary[];
}

interface LoadedData {
  projects: CodeProjectSummary[];
  allFiles: CodeFileDoc[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  textNodeName: "#text",
});

const ATTRIBUTE_KEYS = new Set([
  "id",
  "kind",
  "prot",
  "refid",
  "kindref",
  "static",
  "const",
  "explicit",
  "inline",
  "virt",
  "mutable",
  "local",
  "line",
  "column",
  "bodyfile",
  "bodystart",
  "bodyend",
  "file",
]);

let cache: LoadedData | null = null;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return normalizeWhitespace(String(value));
  }
  if (Array.isArray(value)) {
    return normalizeWhitespace(value.map((item) => toText(item)).join(" "));
  }

  const record = value as UnknownRecord;
  const parts: string[] = [];
  if ("#text" in record) {
    parts.push(toText(record["#text"]));
  }

  for (const [key, nested] of Object.entries(record)) {
    if (key === "#text" || ATTRIBUTE_KEYS.has(key)) {
      continue;
    }
    parts.push(toText(nested));
  }

  return normalizeWhitespace(parts.join(" "));
}

function getRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function getAttr(value: unknown, key: string): string {
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

function parseXmlFile(filePath: string): UnknownRecord | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const xml = fs.readFileSync(filePath, "utf-8");
    const parsed = parser.parse(xml);
    return getRecord(parsed);
  } catch {
    return null;
  }
}

function formatLocation(location: unknown): string {
  const file = getAttr(location, "file");
  const line = getAttr(location, "line");
  if (file && line) {
    return `${file}:${line}`;
  }
  return file;
}

function deriveRouteParts(project: string, sourcePath: string) {
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

function compareByNameThenSignature(
  left: CodeFunctionDoc,
  right: CodeFunctionDoc,
): number {
  return (
    left.name.localeCompare(right.name, "en", { sensitivity: "base" }) ||
    left.signature.localeCompare(right.signature, "en", { sensitivity: "base" })
  );
}

function parseFunction(member: unknown): CodeFunctionDoc {
  const definition = toText(getRecord(member)?.definition);
  const argsString = toText(getRecord(member)?.argsstring);
  const name = toText(getRecord(member)?.name);
  const signature =
    normalizeWhitespace(`${definition}${argsString}`) || `${name}${argsString}`;
  const brief = toText(getRecord(member)?.briefdescription);
  const location = formatLocation(getRecord(member)?.location);

  const qualifiers: string[] = [];
  if (getAttr(member, "prot")) qualifiers.push(getAttr(member, "prot"));
  if (getAttr(member, "static") === "yes") qualifiers.push("static");
  if (getAttr(member, "const") === "yes") qualifiers.push("const");
  if (getAttr(member, "inline") === "yes") qualifiers.push("inline");
  if (getAttr(member, "virt") && getAttr(member, "virt") !== "non-virtual") {
    qualifiers.push(getAttr(member, "virt"));
  }

  const args: CodeFunctionArg[] = asArray(getRecord(member)?.param).map((param) => {
    const paramRecord = getRecord(param);
    return {
      name: toText(paramRecord?.declname),
      type: toText(paramRecord?.type),
      defaultValue: toText(paramRecord?.defval),
    };
  });

  return {
    name,
    signature,
    brief,
    location,
    qualifiers,
    args,
  };
}

function collectFunctionMembers(compounddef: UnknownRecord): CodeFunctionDoc[] {
  const functions: CodeFunctionDoc[] = [];
  const sections = asArray(compounddef.sectiondef);

  for (const section of sections) {
    const sectionRecord = getRecord(section);
    if (!sectionRecord) {
      continue;
    }

    for (const member of asArray(sectionRecord.memberdef)) {
      if (getAttr(member, "kind") !== "function") {
        continue;
      }
      functions.push(parseFunction(member));
    }
  }

  functions.sort(compareByNameThenSignature);
  return functions;
}

function parseClassCompound(
  xmlRoot: string,
  refid: string,
  fallbackName: string,
): CodeClassDoc | null {
  const classDoc = parseXmlFile(path.join(xmlRoot, `${refid}.xml`));
  const compounddef = getRecord(getRecord(classDoc?.doxygen)?.compounddef);
  if (!compounddef) {
    return null;
  }

  const kind = getAttr(compounddef, "kind");
  if (kind !== "class" && kind !== "struct") {
    return null;
  }

  const methods = collectFunctionMembers(compounddef);
  methods.sort(compareByNameThenSignature);

  return {
    refid,
    name: toText(compounddef.compoundname) || fallbackName,
    kind,
    brief: toText(compounddef.briefdescription),
    location: formatLocation(compounddef.location),
    methods,
  };
}

function parseFileCompound(
  project: string,
  projectTitle: string,
  xmlRoot: string,
  refid: string,
): CodeFileDoc | null {
  const fileDoc = parseXmlFile(path.join(xmlRoot, `${refid}.xml`));
  const compounddef = getRecord(getRecord(fileDoc?.doxygen)?.compounddef);
  if (!compounddef) {
    return null;
  }

  const sourcePath = getAttr(compounddef.location, "file");
  if (!sourcePath) {
    return null;
  }

  const route = deriveRouteParts(project, sourcePath);
  const functions = collectFunctionMembers(compounddef);

  const classes: CodeClassDoc[] = [];
  const seenClassRefids = new Set<string>();
  for (const innerClass of asArray(compounddef.innerclass)) {
    const ref = getAttr(innerClass, "refid");
    if (!ref || seenClassRefids.has(ref)) {
      continue;
    }
    seenClassRefids.add(ref);
    const parsed = parseClassCompound(xmlRoot, ref, toText(innerClass));
    if (parsed) {
      classes.push(parsed);
    }
  }

  classes.sort((left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" }),
  );

  return {
    project,
    projectTitle,
    module: route.module,
    fileSlug: route.fileSlug,
    fileName: path.posix.basename(route.fileRemainder),
    fileRemainder: route.fileRemainder,
    sourcePath: sourcePath.replace(/\\/g, "/"),
    sourcePaths: [sourcePath.replace(/\\/g, "/")],
    refid,
    refids: [refid],
    brief: toText(compounddef.briefdescription),
    functions,
    classes,
  };
}

function moduleSortKey(module: string): [number, string] {
  if (module === "src") {
    return [0, module];
  }
  if (module === "root") {
    return [2, module];
  }
  return [1, module];
}

function uniqueFunctions(functions: CodeFunctionDoc[]): CodeFunctionDoc[] {
  const byKey = new Map<string, CodeFunctionDoc>();
  for (const fn of functions) {
    const key = `${fn.name}|${fn.signature}|${fn.location}`;
    if (!byKey.has(key)) {
      byKey.set(key, fn);
    }
  }
  return Array.from(byKey.values()).sort(compareByNameThenSignature);
}

function uniqueClasses(classes: CodeClassDoc[]): CodeClassDoc[] {
  const byRefid = new Map<string, CodeClassDoc>();
  for (const cls of classes) {
    const existing = byRefid.get(cls.refid);
    if (!existing) {
      byRefid.set(cls.refid, cls);
      continue;
    }

    existing.brief = existing.brief || cls.brief;
    existing.location = existing.location || cls.location;
    existing.methods = uniqueFunctions([...existing.methods, ...cls.methods]);
  }

  return Array.from(byRefid.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" }),
  );
}

function mergeKeyForFile(fileRemainder: string): string | null {
  const extension = path.posix.extname(fileRemainder).toLowerCase();
  if (extension !== ".h" && extension !== ".cpp") {
    return null;
  }
  return fileRemainder.slice(0, -extension.length);
}

function mergeHeaderAndSourcePairs(files: CodeFileDoc[]): CodeFileDoc[] {
  const grouped = new Map<string, CodeFileDoc[]>();
  const passthrough: CodeFileDoc[] = [];

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
    grouped.get(key)?.push(file);
  }

  const mergedFiles: CodeFileDoc[] = [...passthrough];
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
    const refids = Array.from(
      new Set(groupFiles.flatMap((item) => item.refids)),
    ).sort((left, right) => left.localeCompare(right, "en"));
    const cppBrief = groupFiles.find(
      (item) =>
        path.posix.extname(item.fileRemainder).toLowerCase() === ".cpp" &&
        Boolean(item.brief),
    )?.brief;
    const headerBrief = groupFiles.find(
      (item) =>
        path.posix.extname(item.fileRemainder).toLowerCase() === ".h" &&
        Boolean(item.brief),
    )?.brief;

    mergedFiles.push({
      project: representative.project,
      projectTitle: representative.projectTitle,
      module: representative.module,
      fileSlug: mergeBase.replace(/\//g, "__"),
      fileName: path.posix.basename(mergeBase),
      fileRemainder: mergeBase,
      sourcePath: sourcePaths.join(" + "),
      sourcePaths,
      refid: refids.join("+"),
      refids,
      brief:
        cppBrief ??
        headerBrief ??
        groupFiles.map((item) => item.brief).find((value) => Boolean(value)) ??
        "",
      functions: uniqueFunctions(groupFiles.flatMap((item) => item.functions)),
      classes: uniqueClasses(groupFiles.flatMap((item) => item.classes)),
    });
  }

  return mergedFiles;
}

function toAnchorId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildTypeHref(fileDoc: CodeFileDoc, className: string): string {
  return `/reference/code/${encodeURIComponent(fileDoc.project)}/${encodeURIComponent(fileDoc.module)}/${encodeURIComponent(fileDoc.fileSlug)}/#${toAnchorId(`type-${className}`)}`;
}

function extractTypeCandidates(typeText: string): string[] {
  const rawTokens = typeText.match(/[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*/g) ?? [];
  const builtinTokens = new Set([
    "void",
    "bool",
    "char",
    "short",
    "int",
    "long",
    "float",
    "double",
    "signed",
    "unsigned",
    "const",
    "volatile",
    "struct",
    "class",
    "enum",
    "typename",
    "auto",
    "size_t",
    "uint8_t",
    "uint16_t",
    "uint32_t",
    "uint64_t",
    "int8_t",
    "int16_t",
    "int32_t",
    "int64_t",
    "std",
  ]);

  const filtered = rawTokens.filter((token) => !builtinTokens.has(token));
  const unique = Array.from(new Set(filtered));
  unique.sort((left, right) => right.length - left.length);
  return unique;
}

interface TypeLinkCandidate {
  href: string;
  project: string;
  module: string;
  fileSlug: string;
}

function addTypeCandidate(
  index: Map<string, TypeLinkCandidate[]>,
  typeName: string,
  candidate: TypeLinkCandidate,
): void {
  if (!typeName) {
    return;
  }
  if (!index.has(typeName)) {
    index.set(typeName, []);
  }
  const entries = index.get(typeName);
  if (!entries) {
    return;
  }
  if (entries.some((entry) => entry.href === candidate.href)) {
    return;
  }
  entries.push(candidate);
}

function rankTypeCandidate(
  ownerFile: CodeFileDoc,
  candidate: TypeLinkCandidate,
): number {
  let rank = 0;
  if (candidate.project === ownerFile.project) {
    rank += 100;
  }
  if (candidate.module === ownerFile.module) {
    rank += 10;
  }
  if (candidate.fileSlug === ownerFile.fileSlug) {
    rank += 1;
  }
  return rank;
}

function resolveTypeLink(
  ownerFile: CodeFileDoc,
  typeText: string,
  index: Map<string, TypeLinkCandidate[]>,
): { href: string; token: string } | undefined {
  for (const candidateType of extractTypeCandidates(typeText)) {
    const candidates = index.get(candidateType);
    if (!candidates || candidates.length === 0) {
      continue;
    }

    const ranked = [...candidates].sort((left, right) => {
      const leftRank = rankTypeCandidate(ownerFile, left);
      const rightRank = rankTypeCandidate(ownerFile, right);
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }
      return left.href.localeCompare(right.href, "en", { sensitivity: "base" });
    });

    const href = ranked[0]?.href;
    if (href) {
      return { href, token: candidateType };
    }
  }
  return undefined;
}

function annotateArgTypeLinks(files: CodeFileDoc[]): void {
  const typeIndex = new Map<string, TypeLinkCandidate[]>();
  for (const fileDoc of files) {
    for (const classDoc of fileDoc.classes) {
      const href = buildTypeHref(fileDoc, classDoc.name);
      const candidate: TypeLinkCandidate = {
        href,
        project: fileDoc.project,
        module: fileDoc.module,
        fileSlug: fileDoc.fileSlug,
      };
      addTypeCandidate(typeIndex, classDoc.name, candidate);

      const nestedSuffix = classDoc.name.includes("::")
        ? classDoc.name.split("::").at(-1)
        : null;
      if (nestedSuffix) {
        addTypeCandidate(typeIndex, nestedSuffix, candidate);
      }
    }
  }

  const attachLink = (ownerFile: CodeFileDoc, arg: CodeFunctionArg) => {
    if (!arg.type) {
      return;
    }
    const link = resolveTypeLink(ownerFile, arg.type, typeIndex);
    if (link) {
      arg.typeHref = link.href;
      arg.typeLinkToken = link.token;
    }
  };

  for (const fileDoc of files) {
    for (const fn of fileDoc.functions) {
      for (const arg of fn.args) {
        attachLink(fileDoc, arg);
      }
    }
    for (const classDoc of fileDoc.classes) {
      for (const method of classDoc.methods) {
        for (const arg of method.args) {
          attachLink(fileDoc, arg);
        }
      }
    }
  }
}

function loadProject(project: string): CodeProjectSummary {
  const projectTitle = PROJECT_TITLES[project] ?? project;
  const xmlRoot = path.join(CODE_REFERENCE_ROOT, project, "xml");
  const indexDoc = parseXmlFile(path.join(xmlRoot, "index.xml"));
  const index = getRecord(indexDoc?.doxygenindex);

  const parsedFiles: CodeFileDoc[] = [];
  const compounds = asArray(index?.compound);
  for (const compound of compounds) {
    if (getAttr(compound, "kind") !== "file") {
      continue;
    }
    const refid = getAttr(compound, "refid");
    if (!refid) {
      continue;
    }
    const parsed = parseFileCompound(project, projectTitle, xmlRoot, refid);
    if (!parsed) {
      continue;
    }
    parsedFiles.push(parsed);
  }

  const files = mergeHeaderAndSourcePairs(parsedFiles);

  const modules = new Map<string, CodeFileDoc[]>();
  for (const parsed of files) {
    if (!modules.has(parsed.module)) {
      modules.set(parsed.module, []);
    }
    modules.get(parsed.module)?.push(parsed);
  }

  const moduleSummaries: CodeModuleSummary[] = [];
  for (const [module, files] of modules.entries()) {
    files.sort((left, right) =>
      left.fileRemainder.localeCompare(right.fileRemainder, "en", {
        sensitivity: "base",
      }),
    );
    moduleSummaries.push({
      project,
      projectTitle,
      module,
      files,
    });
  }

  moduleSummaries.sort((left, right) => {
    const [leftRank, leftName] = moduleSortKey(left.module);
    const [rightRank, rightName] = moduleSortKey(right.module);
    return leftRank - rightRank || leftName.localeCompare(rightName, "en");
  });

  return {
    project,
    title: projectTitle,
    modules: moduleSummaries,
  };
}

function loadAllData(): LoadedData {
  if (cache) {
    return cache;
  }

  if (!fs.existsSync(CODE_REFERENCE_ROOT)) {
    cache = {
      projects: [],
      allFiles: [],
    };
    return cache;
  }

  const projectNames = fs
    .readdirSync(CODE_REFERENCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

  const projects = projectNames.map((project) => loadProject(project));
  const allFiles = projects.flatMap((project) =>
    project.modules.flatMap((module) => module.files),
  );
  annotateArgTypeLinks(allFiles);

  cache = {
    projects,
    allFiles,
  };
  return cache;
}

export function getProjectSummaries(): CodeProjectSummary[] {
  return loadAllData().projects;
}

export function getProjectSummary(project: string): CodeProjectSummary | undefined {
  return loadAllData().projects.find((item) => item.project === project);
}

export function getModuleSummary(
  project: string,
  module: string,
): CodeModuleSummary | undefined {
  return getProjectSummary(project)?.modules.find((item) => item.module === module);
}

export function getFileDoc(
  project: string,
  module: string,
  fileSlug: string,
): CodeFileDoc | undefined {
  return loadAllData().allFiles.find(
    (item) =>
      item.project === project &&
      item.module === module &&
      item.fileSlug === fileSlug,
  );
}
