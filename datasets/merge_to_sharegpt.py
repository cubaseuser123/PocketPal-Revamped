"""
Merge all Pally training datasets into 3 consolidated JSONL files.

Output format (OpenAI messages):
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}

Output files: train.jsonl, valid.jsonl, test.jsonl
"""

import json
import os
import re
from pathlib import Path

PALLY_SYSTEM_PROMPT = (
    "You are Pally, PocketPal's friendly AI money coach for Indian students.\n"
    "Rules:\n"
    "- Never invent numbers\n"
    "- Use tools when needed\n"
    "- Roast choices, not people\n"
    "- Be supportive and use Hindi/Hinglish flair when appropriate"
)


def parse_tool_prompt(prompt_text: str) -> dict:
    """Parse ### System / ### User / ### Assistant format from tool datasets."""
    system_match = re.search(r"### System:\n(.*?)(?=\n### User:)", prompt_text, re.DOTALL)
    user_match = re.search(r"### User:\n(.*?)(?=\n### Assistant:)", prompt_text, re.DOTALL)

    system = system_match.group(1).strip() if system_match else PALLY_SYSTEM_PROMPT
    user = user_match.group(1).strip() if user_match else prompt_text.strip()

    return {"system": system, "user": user}


def convert_to_messages(entry: dict, is_tool_format: bool) -> dict:
    """Convert a single JSONL entry to OpenAI messages format."""
    if is_tool_format:
        parsed = parse_tool_prompt(entry["prompt"])
        messages = [
            {"role": "system", "content": parsed["system"]},
            {"role": "user", "content": parsed["user"]},
            {"role": "assistant", "content": entry["completion"]},
        ]
    else:
        messages = [
            {"role": "system", "content": PALLY_SYSTEM_PROMPT},
            {"role": "user", "content": entry["prompt"]},
            {"role": "assistant", "content": entry["completion"]},
        ]

    return {"messages": messages}


def detect_format(filepath: Path) -> bool:
    """Returns True if the file uses ### System/User/Assistant tool format."""
    with open(filepath, "r", encoding="utf-8") as f:
        first_line = f.readline().strip()
        if first_line:
            data = json.loads(first_line)
            return "### System:" in data.get("prompt", "") or "### User:" in data.get("prompt", "")
    return False


def process_file(filepath: Path) -> list[dict]:
    """Read a JSONL file and convert all entries to messages format."""
    is_tool = detect_format(filepath)
    results = []

    with open(filepath, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                results.append(convert_to_messages(entry, is_tool))
            except json.JSONDecodeError as e:
                print(f"  ⚠️  Skipping line {line_num} in {filepath.name}: {e}")

    return results


def merge_datasets(base_dir: Path, split: str) -> list[dict]:
    """Walk all subdirectories and merge all files of a given split."""
    all_entries = []

    for root, dirs, files in os.walk(base_dir / "pally"):
        for filename in sorted(files):
            if filename == f"{split}.jsonl":
                filepath = Path(root) / filename
                rel_path = filepath.relative_to(base_dir)
                entries = process_file(filepath)
                print(f"  📄 {rel_path}: {len(entries)} examples")
                all_entries.extend(entries)

    return all_entries


def write_jsonl(entries: list[dict], output_path: Path):
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def main():
    base_dir = Path(__file__).parent
    output_dir = base_dir / "output"
    output_dir.mkdir(exist_ok=True)

    for split in ["train", "valid", "test"]:
        print(f"\n{'='*50}")
        print(f"🔄 Merging {split} split...")
        print(f"{'='*50}")

        entries = merge_datasets(base_dir, split)

        output_file = output_dir / f"{split}.jsonl"
        write_jsonl(entries, output_file)

        print(f"\n✅ {split}.jsonl: {len(entries)} total examples")
        print(f"   📁 Saved to: {output_file}")

    # Summary
    print(f"\n{'='*50}")
    print("🎉 All done! Files ready for Colab upload:")
    print(f"{'='*50}")
    for split in ["train", "valid", "test"]:
        path = output_dir / f"{split}.jsonl"
        size_kb = path.stat().st_size / 1024
        with open(path, "r", encoding="utf-8") as f:
            count = sum(1 for _ in f)
        print(f"  📄 {split}.jsonl: {count} examples ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
