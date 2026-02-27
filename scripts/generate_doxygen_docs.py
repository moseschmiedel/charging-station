#!/usr/bin/env python3
"""Generate Doxygen XML for the docs site.

This file intentionally keeps the historic `.sh` path, but is implemented in Python.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

MODULES = ("master", "slave", "ir_meter", "motor", "dezibot")
INSIDE_PIXI_ENV_FLAG = "DOXYGEN_DOCS_RUNNING_IN_PIXI"


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def build_doxyfile(
    root_dir: Path, output_dir: Path, module: str, inputs: list[Path]
) -> str:
    lines = [
        f'PROJECT_NAME           = "charging-station-{module}"',
        f'OUTPUT_DIRECTORY       = "{output_dir}"',
        "CREATE_SUBDIRS         = NO",
        "OPTIMIZE_OUTPUT_FOR_C  = YES",
        "EXTRACT_ALL            = YES",
        "EXTRACT_PRIVATE        = NO",
        "EXTRACT_STATIC         = YES",
        "RECURSIVE              = YES",
        "FULL_PATH_NAMES        = YES",
        f'STRIP_FROM_PATH        = "{root_dir}"',
        "FILE_PATTERNS          = *.h *.hpp *.hh *.c *.cc *.cpp *.ino",
        "EXCLUDE_PATTERNS       = */.pio/* */build/* */dist/* */node_modules/* */test/*",
        "GENERATE_HTML          = NO",
        "GENERATE_XML           = YES",
        "XML_OUTPUT             = xml",
        "GENERATE_LATEX         = NO",
        "GENERATE_MAN           = NO",
        "GENERATE_RTF           = NO",
        "GENERATE_DOCBOOK       = NO",
        "WARN_IF_UNDOCUMENTED   = NO",
        "QUIET                  = YES",
        "HAVE_DOT               = NO",
        "INPUT                  = " + " ".join(str(path) for path in inputs),
    ]
    return "\n".join(lines) + "\n"


def module_inputs(root_dir: Path, module: str) -> list[Path]:
    module_dir = root_dir / module
    if module == "dezibot":
        candidates = [
            module_dir / "src",
            module_dir / "Dezibot.h",
            module_dir / "src" / "Dezibot.cpp",
        ]
    else:
        candidates = [module_dir / "src", module_dir / "include", module_dir / "lib"]
    return [path for path in candidates if path.exists()]


def ensure_running_in_pixi_environment(root_dir: Path) -> None:
    if os.environ.get(INSIDE_PIXI_ENV_FLAG) == "1":
        return

    pixi = shutil.which("pixi")
    if pixi is None:
        print("error: pixi is required. Install pixi and rerun.", file=sys.stderr)
        raise SystemExit(1)

    env = dict(os.environ)
    env[INSIDE_PIXI_ENV_FLAG] = "1"
    manifest_path = root_dir / "scripts" / "pixi.toml"
    cmd = [
        pixi,
        "run",
        "--manifest-path",
        str(manifest_path),
        "python",
        str(Path(__file__).resolve()),
        *sys.argv[1:],
    ]
    raise SystemExit(subprocess.call(cmd, env=env, cwd=root_dir))


def run_doxygen_for_module(root_dir: Path, doxygen_root: Path, module: str) -> None:
    inputs = module_inputs(root_dir, module)
    if not inputs:
        print(f"warning: skipping {module} (no input paths found)", file=sys.stderr)
        return

    output_dir = doxygen_root / module
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    content = build_doxyfile(
        root_dir=root_dir, output_dir=output_dir, module=module, inputs=inputs
    )

    with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8") as handle:
        handle.write(content)
        doxyfile_path = Path(handle.name)

    try:
        print(f"Generating Doxygen XML for {module}...")
        subprocess.run(["doxygen", str(doxyfile_path)], check=True, cwd=root_dir)
    finally:
        doxyfile_path.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Doxygen XML outputs.")
    parser.add_argument(
        "--skip-pixi",
        action="store_true",
        help="Run directly in current environment instead of re-exec through pixi.",
    )
    args = parser.parse_args()

    root_dir = repo_root()
    doxygen_root = root_dir / "docs" / "src" / "code-reference"

    if not args.skip_pixi:
        ensure_running_in_pixi_environment(root_dir)

    doxygen_root.mkdir(parents=True, exist_ok=True)

    if shutil.which("doxygen") is None:
        print(
            "error: doxygen is not available in the active environment.",
            file=sys.stderr,
        )
        return 1

    for module in MODULES:
        run_doxygen_for_module(
            root_dir=root_dir, doxygen_root=doxygen_root, module=module
        )

    print("Done. Generated XML is in docs/src/code-reference/<project>/xml/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
