#!/usr/bin/env python3
"""Convert Doxygen XML output into Starlight Markdown pages."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

MODULE_TITLES = {
    "master": "Master",
    "slave": "Slave",
    "ir_meter": "IR Meter",
    "motor": "Motor",
    "dezibot": "Dezibot",
}


@dataclass
class FunctionSymbol:
    name: str
    args: str
    brief: str
    location: str


@dataclass
class CompoundSymbol:
    name: str
    kind: str
    brief: str
    location: str
    functions: List[FunctionSymbol]


def normalize(text: str) -> str:
    collapsed = re.sub(r"\s+", " ", text or "").strip()
    return html.unescape(collapsed)


def flatten(elem: ET.Element | None) -> str:
    if elem is None:
        return ""
    return normalize("".join(elem.itertext()))


def safe_md(text: str) -> str:
    return (text or "").replace("|", r"\|")


def parse_location(member: ET.Element) -> str:
    location = member.find("location")
    if location is None:
        return ""
    file_path = location.get("file", "")
    line = location.get("line", "")
    if file_path and line:
        return f"{file_path}:{line}"
    return file_path


def parse_compound(xml_dir: Path, refid: str, name: str, kind: str) -> CompoundSymbol:
    detail_file = xml_dir / f"{refid}.xml"
    if not detail_file.exists():
        return CompoundSymbol(name=name, kind=kind, brief="", location="", functions=[])

    root = ET.parse(detail_file).getroot()
    compounddef = root.find("compounddef")
    if compounddef is None:
        return CompoundSymbol(name=name, kind=kind, brief="", location="", functions=[])

    brief = flatten(compounddef.find("briefdescription"))
    location = parse_location(compounddef)
    functions: List[FunctionSymbol] = []

    for section in compounddef.findall("sectiondef"):
        for member in section.findall("memberdef"):
            if member.get("kind") != "function":
                continue
            symbol_name = flatten(member.find("name"))
            args = flatten(member.find("argsstring"))
            symbol_brief = flatten(member.find("briefdescription"))
            symbol_location = parse_location(member)
            functions.append(
                FunctionSymbol(
                    name=symbol_name,
                    args=args,
                    brief=symbol_brief,
                    location=symbol_location,
                )
            )

    functions.sort(key=lambda fn: (fn.name.lower(), fn.args))
    return CompoundSymbol(
        name=name,
        kind=kind,
        brief=brief,
        location=location,
        functions=functions,
    )


def parse_module(xml_dir: Path) -> List[CompoundSymbol]:
    index_file = xml_dir / "index.xml"
    if not index_file.exists():
        return []

    root = ET.parse(index_file).getroot()
    compounds: List[CompoundSymbol] = []

    for compound in root.findall("compound"):
        refid = compound.get("refid", "")
        kind = compound.get("kind", "unknown")
        name = flatten(compound.find("name"))
        if not refid or not name:
            continue
        compounds.append(parse_compound(xml_dir, refid, name, kind))

    compounds.sort(key=lambda c: (c.kind, c.name.lower()))
    return compounds


def render_module_page(
    module: str,
    compounds: List[CompoundSymbol],
    xml_dir: Path,
    order: int,
) -> str:
    title_prefix = MODULE_TITLES.get(module, module.replace("_", " ").title())
    now = (
        dt.datetime.now(dt.timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )
    lines: List[str] = [
        "---",
        f"title: {title_prefix}",
        "description: Auto-generated API summary from Doxygen XML.",
        "---",
        "",
        "> Auto-generated. Do not edit manually.",
        "",
        f"- Module: `{module}`",
        f"- Generated at: `{now}`",
        "",
    ]

    if not compounds:
        lines.extend(
            [
                "## Status",
                "",
                "No Doxygen XML was found for this module.",
                "",
                "Run `python3 scripts/generate_doxygen_docs.py` from repository root.",
                "",
            ]
        )
        return "\n".join(lines)

    lines.append("## Functions")
    lines.append("")
    for compound in compounds:
        if not compound.functions:
            continue
        lines.append(f"### `{compound.name}`")
        lines.append("")
        for function in compound.functions:
            signature = f"{function.name}{function.args}"
            brief = f" - {function.brief}" if function.brief else ""
            loc = f" (`{function.location}`)" if function.location else ""
            lines.append(f"- `{safe_md(signature)}`{loc}{brief}")
        lines.append("")

    return "\n".join(lines)


def render_index_page(modules: Iterable[str]) -> str:
    now = (
        dt.datetime.now(dt.timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )
    lines = [
        "---",
        "title: Code API (Doxygen)",
        "description: Auto-generated code API reference from Doxygen XML outputs.",
        "sidebar:",
        "  order: 99",
        "---",
        "",
        "> This section is generated from Doxygen XML.",
        "",
        f"Generated at: `{now}`.",
        "",
        "## Modules",
        "",
    ]
    for module in modules:
        title = MODULE_TITLES.get(module, module.replace("_", " ").title())
        lines.append(f"- [{title}](/reference/code/{module}/)")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--doxygen-root", required=True)
    parser.add_argument("--docs-root", required=True)
    parser.add_argument("--modules", nargs="+", required=True)
    args = parser.parse_args()

    doxygen_root = Path(args.doxygen_root).resolve()
    docs_root = Path(args.docs_root).resolve()
    docs_root.mkdir(parents=True, exist_ok=True)

    for idx, module in enumerate(args.modules, start=1):
        xml_dir = doxygen_root / module / "xml"
        compounds = parse_module(xml_dir)
        output = render_module_page(module, compounds, xml_dir, order=idx + 1)
        (docs_root / f"{module}.md").write_text(output, encoding="utf-8")

    index_md = render_index_page(args.modules)
    (docs_root / "index.md").write_text(index_md, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
