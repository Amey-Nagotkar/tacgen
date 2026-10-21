#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import re
import shutil

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BUILD_BIN = os.path.join(ROOT_DIR, "build", "tacgen")
OUT_DIR = os.path.join(ROOT_DIR, "out")
WEB_DIR = os.path.join(ROOT_DIR, "web-demo")
DATA_DIR = os.path.join(WEB_DIR, "data")
CFG_ASSETS_DIR = os.path.join(WEB_DIR, "assets", "cfg")

BENCHMARKS = [
    {
        "id": "b1",
        "name": "b1: While-Loop Relational Jump",
        "file": "bench/b1.mini",
        "description": "Standard while-loop example from Stage-2 Report (Table 6). Demonstrates inverted relational jumps, loop headers, retreating back-edges, and dominance-frontier phi placement for accumulators.",
        "extra_opt_flags": []
    },
    {
        "id": "b2",
        "name": "b2: Basic Block Arithmetic & Redundancies",
        "file": "bench/b2.mini",
        "description": "Single-block sequence from Stage-2 Report (Table 9). Features constant folding, strength reduction (* 8 -> << 3), common subexpression elimination (b + c), copy propagation, and dead code elimination with specified live-out variables.",
        "extra_opt_flags": ["--live-out", "y,z,w,u"]
    },
    {
        "id": "b3",
        "name": "b3: Common Subexpressions & Storage Formats",
        "file": "bench/b3.mini",
        "description": "Expression evaluation (a = b * -c + b * -c) from Stage-2 Report (Table 10). Used to compare mutation costs across Quadruples, Triples, and Indirect Triples during subexpression elimination.",
        "extra_opt_flags": [],
        "has_edit_demo": True
    },
    {
        "id": "b4",
        "name": "b4: Synthetic Benchmark (Loops, Branches & Arrays)",
        "file": "bench/b4.mini",
        "description": "Complex synthetic program with nested loops, compound boolean branch conditions (|| and &&), array loads, accumulator variables, and 16 virtual temporaries. Validates scalability and dead phi elimination in pruned SSA.",
        "extra_opt_flags": []
    }
]

def run_cmd(args):
    try:
        res = subprocess.run(args, cwd=ROOT_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {' '.join(args)}\nError: {e.stderr}", file=sys.stderr)
        return e.stdout or e.stderr

def ensure_build():
    if not os.path.exists(BUILD_BIN):
        print("Building tacgen...")
        subprocess.run(["cmake", "--build", "build"], cwd=ROOT_DIR, check=True)

def parse_tokens(raw_output):
    tokens = []
    lines = raw_output.strip().split("\n")
    # Header format: Line | Token Class   | Lexeme
    for line in lines:
        parts = [p.strip() for p in line.split("|")]
        if len(parts) == 3:
            if parts[0].isdigit():
                tokens.append({
                    "line": int(parts[0]),
                    "class": parts[1],
                    "lexeme": parts[2]
                })
    return tokens

def parse_tac(raw_output):
    lines = raw_output.strip().split("\n")
    instructions = []
    summary = ""
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        if line_clean.startswith("instructions="):
            summary = line_clean
            continue
        # Format: "1: s = 0" or "3: L1: if i > n goto L2"
        m = re.match(r"^(\d+):\s*(.*)$", line_clean)
        if m:
            num = int(m.group(1))
            rest = m.group(2)
            label = ""
            code = rest
            if ":" in rest:
                lp = rest.split(":", 1)
                if not any(kw in lp[0] for kw in ["if", "goto", "return", "call"]):
                    label = lp[0].strip()
                    code = lp[1].strip()
            instructions.append({
                "num": num,
                "label": label,
                "code": code,
                "raw": line_clean
            })
    return {"instructions": instructions, "summary": summary}

def parse_formats(raw_output):
    sections = raw_output.split("\n\n")
    quads = []
    triples = []
    indirect = []
    summary_table = []

    lines = raw_output.split("\n")
    curr_mode = None
    for line in lines:
        s = line.strip()
        if s == "QUADRUPLES":
            curr_mode = "quads"
            continue
        elif s == "TRIPLES":
            curr_mode = "triples"
            continue
        elif s == "INDIRECT TRIPLES":
            curr_mode = "indirect"
            continue
        elif s.startswith("format") and "entries" in s and "bytes" in s:
            curr_mode = "summary"
            continue

        if curr_mode == "quads":
            if s.startswith("index") or not s:
                continue
            # e.g.: "(0)    minus   c               t1      "
            # split with regex keeping empty columns or spacing
            parts = re.split(r"\s{2,}", s)
            if len(parts) >= 2:
                idx = parts[0]
                op = parts[1] if len(parts) > 1 else ""
                arg1 = parts[2] if len(parts) > 2 else ""
                arg2 = parts[3] if len(parts) > 3 else ""
                result = parts[4] if len(parts) > 4 else ""
                label = parts[5] if len(parts) > 5 else ""
                quads.append({"index": idx, "op": op, "arg1": arg1, "arg2": arg2, "result": result, "label": label, "raw": s})
        elif curr_mode == "triples":
            if s.startswith("index") or not s:
                continue
            parts = re.split(r"\s{2,}", s)
            if len(parts) >= 2:
                idx = parts[0]
                op = parts[1] if len(parts) > 1 else ""
                arg1 = parts[2] if len(parts) > 2 else ""
                arg2 = parts[3] if len(parts) > 3 else ""
                label = parts[4] if len(parts) > 4 else ""
                triples.append({"index": idx, "op": op, "arg1": arg1, "arg2": arg2, "label": label, "raw": s})
        elif curr_mode == "indirect":
            if s.startswith("pointer") or not s:
                continue
            parts = re.split(r"\s+", s)
            if len(parts) >= 2:
                indirect.append({"pointer": parts[0], "target": parts[1]})
        elif curr_mode == "summary":
            if "|" in s and not s.startswith("format"):
                parts = [p.strip() for p in s.split("|")]
                if len(parts) == 3:
                    summary_table.append({
                        "format": parts[0],
                        "entries": int(parts[1]),
                        "bytes": int(parts[2])
                    })

    return {
        "quadruples": quads,
        "triples": triples,
        "indirect_triples": indirect,
        "summary": summary_table
    }

def parse_blocks(raw_output):
    lines = raw_output.strip().split("\n")
    blocks = []
    current_block = None
    summary = {}
    back_edges = []

    for line in lines:
        s = line.rstrip()
        if not s:
            continue
        if s.startswith("B") and "[" in s and "]" in s:
            # e.g.: B1 [1-2] labels=- pred=- succ=B2
            # B2 [3-3] labels=L1 pred=B1,B3 succ=B3(i <= n),B4(i > n)
            m = re.match(r"^(B\d+)\s+\[(\d+)-(\d+)\]\s+labels=([^\s]+)\s+pred=([^\s]+)\s+succ=(.*)$", s)
            if m:
                if current_block:
                    blocks.append(current_block)
                current_block = {
                    "id": m.group(1),
                    "range": f"[{m.group(2)}-{m.group(3)}]",
                    "labels": m.group(4) if m.group(4) != "-" else "",
                    "pred": [p for p in m.group(5).split(",") if p and p != "-"],
                    "succ": [sc for sc in m.group(6).split(",") if sc and sc != "-"],
                    "instrs": []
                }
                continue
        elif s.startswith("back edges:"):
            # back edges: B3->B2
            be_str = s.replace("back edges:", "").strip()
            if be_str and be_str != "none":
                back_edges = [x.strip() for x in be_str.split(",") if x.strip()]
        elif s.startswith("blocks="):
            # blocks=4 edges=4 back_edges=1
            m = re.match(r"^blocks=(\d+)\s+edges=(\d+)\s+back_edges=(\d+)$", s)
            if m:
                summary = {
                    "blocks": int(m.group(1)),
                    "edges": int(m.group(2)),
                    "back_edges": int(m.group(3))
                }
        else:
            if current_block and s.startswith("    "):
                current_block["instrs"].append(s.strip())

    if current_block:
        blocks.append(current_block)

    return {"blocks": blocks, "summary": summary, "back_edges": back_edges}

def parse_opt(raw_output):
    pass_table = []
    optimized_code = []
    summary_str = ""

    lines = raw_output.split("\n")
    mode = None
    for line in lines:
        s = line.rstrip()
        if "optimized code:" in s:
            mode = "code"
            continue
        elif s.startswith("instructions:"):
            summary_str = s
            mode = None
            continue

        if mode == "code":
            if s:
                optimized_code.append(s)
        elif "|" in s:
            parts = [p.strip() for p in s.split("|")]
            if len(parts) == 4 and parts[0].isdigit():
                pass_table.append({
                    "pass_num": int(parts[0]),
                    "name": parts[1],
                    "changes": int(parts[2]),
                    "instrs_after": int(parts[3])
                })

    return {
        "pass_table": pass_table,
        "optimized_code": "\n".join(optimized_code),
        "summary": summary_str
    }

def parse_ssa(raw_output):
    lines = raw_output.split("\n")
    dom_table = []
    ssa_code = []
    summary_line = ""
    verify_line = ""

    mode = "dom"
    for line in lines:
        s = line.rstrip()
        if not s:
            if mode == "dom" and dom_table:
                mode = "code"
            continue
        if s.startswith("phis_"):
            summary_line = s
            continue
        if s.startswith("verify:"):
            verify_line = s
            continue

        if mode == "dom":
            if "|" in s and not s.startswith("Block"):
                parts = [p.strip() for p in s.split("|")]
                if len(parts) == 4:
                    dom_table.append({
                        "block": parts[0],
                        "idom": parts[1],
                        "df": parts[2],
                        "phis": parts[3] if parts[3] != "-" else ""
                    })
        elif mode == "code":
            ssa_code.append(s)

    return {
        "dom_table": dom_table,
        "ssa_code": "\n".join(ssa_code),
        "summary": summary_line,
        "verify": verify_line
    }

def parse_ssa_opt(raw_output):
    lines = raw_output.split("\n")
    ssa_opt_code = []
    summary_line = ""
    verify_line = ""

    for line in lines:
        s = line.rstrip()
        if s.startswith("ssa instrs:"):
            summary_line = s
        elif s.startswith("verify:"):
            verify_line = s
        elif s:
            ssa_opt_code.append(s)

    return {
        "code": "\n".join(ssa_opt_code),
        "summary": summary_line,
        "verify": verify_line
    }

def parse_metrics_table(raw_output):
    metrics = {}
    for line in raw_output.strip().split("\n"):
        if "|" in line and not line.startswith("metric") and not line.startswith("---"):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) == 2:
                k = parts[0]
                val = parts[1].replace("(indicative only)", "").strip()
                metrics[k] = val
    return metrics

def main():
    ensure_build()
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(CFG_ASSETS_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1. Run metrics-all to generate updated out/metrics.csv
    print("Generating comprehensive metrics CSV with 200 runs...")
    run_cmd([BUILD_BIN, "--metrics-all", "bench", "--runs", "200"])
    if os.path.exists(os.path.join(OUT_DIR, "metrics.csv")):
        shutil.copy(os.path.join(OUT_DIR, "metrics.csv"), os.path.join(DATA_DIR, "metrics.csv"))

    benchmarks_data = {}

    for b in BENCHMARKS:
        bid = b["id"]
        bfile = b["file"]
        print(f"Processing {bid} ({bfile})...")

        with open(os.path.join(ROOT_DIR, bfile), "r", encoding="utf-8") as f:
            source_code = f.read()

        # Generate DOT and convert to SVG and PNG
        dot_path = os.path.join(CFG_ASSETS_DIR, f"{bid}.dot")
        svg_path = os.path.join(CFG_ASSETS_DIR, f"{bid}.svg")
        png_path = os.path.join(CFG_ASSETS_DIR, f"{bid}.png")

        run_cmd([BUILD_BIN, bfile, "--cfg", dot_path])
        with open(dot_path, "r", encoding="utf-8") as f:
            dot_content = f.read()

        # Render with Graphviz
        if shutil.which("dot"):
            subprocess.run(["dot", "-Tsvg", dot_path, "-o", svg_path], check=True)
            subprocess.run(["dot", "-Tpng", dot_path, "-o", png_path], check=True)

        # Execute compiler passes
        out_tokens = run_cmd([BUILD_BIN, bfile, "--tokens"])
        out_ast = run_cmd([BUILD_BIN, bfile, "--ast"])
        out_tac = run_cmd([BUILD_BIN, bfile, "--tac"])
        out_formats = run_cmd([BUILD_BIN, bfile, "--formats"])
        out_blocks = run_cmd([BUILD_BIN, bfile, "--blocks"])
        
        opt_cmd = [BUILD_BIN, bfile, "--opt"] + b["extra_opt_flags"]
        out_opt = run_cmd(opt_cmd)

        out_ssa = run_cmd([BUILD_BIN, bfile, "--ssa"])
        out_ssa_unpruned = run_cmd([BUILD_BIN, bfile, "--ssa-unpruned"])
        
        ssa_opt_cmd = [BUILD_BIN, bfile, "--ssa-opt"] + b["extra_opt_flags"]
        out_ssa_opt = run_cmd(ssa_opt_cmd)

        out_braun = run_cmd([BUILD_BIN, bfile, "--ssa-braun"] + b["extra_opt_flags"])
        out_compare = run_cmd([BUILD_BIN, bfile, "--ssa-compare"] + b["extra_opt_flags"])
        out_metrics = run_cmd([BUILD_BIN, bfile, "--metrics", "--runs", "200"] + b["extra_opt_flags"])
        out_all = run_cmd([BUILD_BIN, bfile, "--all"] + b["extra_opt_flags"])

        edit_demo_data = None
        if b.get("has_edit_demo"):
            out_edit_demo = run_cmd([BUILD_BIN, bfile, '--edit-demo', '2:0,3:1'])
            edit_demo_data = {
                "raw": out_edit_demo
            }

        svg_content = ""
        if os.path.exists(svg_path):
            with open(svg_path, "r", encoding="utf-8") as f:
                svg_content = f.read()

        benchmarks_data[bid] = {
            "id": bid,
            "name": b["name"],
            "file": bfile,
            "description": b["description"],
            "source": source_code,
            "tokens": {
                "raw": out_tokens,
                "parsed": parse_tokens(out_tokens)
            },
            "ast": {
                "raw": out_ast
            },
            "tac": {
                "raw": out_tac,
                "parsed": parse_tac(out_tac)
            },
            "formats": {
                "raw": out_formats,
                "parsed": parse_formats(out_formats),
                "edit_demo": edit_demo_data
            },
            "blocks": {
                "raw": out_blocks,
                "parsed": parse_blocks(out_blocks)
            },
            "cfg": {
                "dot": dot_content,
                "svg": svg_content,
                "svg_url": f"assets/cfg/{bid}.svg",
                "png_url": f"assets/cfg/{bid}.png"
            },
            "opt": {
                "raw": out_opt,
                "parsed": parse_opt(out_opt)
            },
            "ssa": {
                "raw": out_ssa,
                "parsed": parse_ssa(out_ssa),
                "unpruned_raw": out_ssa_unpruned
            },
            "ssa_opt": {
                "raw": out_ssa_opt,
                "parsed": parse_ssa_opt(out_ssa_opt)
            },
            "braun": {
                "raw": out_braun
            },
            "compare": {
                "raw": out_compare
            },
            "metrics": {
                "raw": out_metrics,
                "parsed": parse_metrics_table(out_metrics)
            },
            "all": {
                "raw": out_all
            }
        }

    # Save to JSON
    json_path = os.path.join(DATA_DIR, "benchmarks.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(benchmarks_data, f, indent=2)
    print(f"Saved structured demonstration data to {json_path}")

    # Also save to JS file for direct offline file:/// previewing
    js_path = os.path.join(DATA_DIR, "benchmarks.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.TACGEN_DATA = ")
        json.dump(benchmarks_data, f, indent=2)
        f.write(";\n")
    print(f"Saved offline-compatible data to {js_path}")

    print("Data generation complete!")

if __name__ == "__main__":
    main()
