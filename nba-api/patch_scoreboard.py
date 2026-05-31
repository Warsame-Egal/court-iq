#!/usr/bin/env python3
"""Fix scoreboardv2 when nba_api expects optional result sets NBA no longer returns."""

import sys
from pathlib import Path

_DATASET_KEY = "Win" + "Probability"


def _scoreboard_file() -> Path:
    import nba_api

    path = Path(nba_api.__file__).parent / "stats" / "endpoints" / "scoreboardv2.py"
    if not path.exists():
        raise FileNotFoundError(path)
    return path


def main() -> None:
    path = _scoreboard_file()
    text = path.read_text(encoding="utf-8")
    old = f'data_sets["{_DATASET_KEY}"]'
    new = f'data_sets.get("{_DATASET_KEY}", [])'
    if old in text:
        path.write_text(text.replace(old, new), encoding="utf-8")
        print("scoreboardv2 compat ok")
    elif new in text:
        print("scoreboardv2 compat already applied")
    else:
        print("scoreboardv2 compat: pattern not found", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
