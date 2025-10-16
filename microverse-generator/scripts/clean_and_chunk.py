#!/usr/bin/env python3
"""
Clean a raw text file and chunk it into ~384-character blocks.

Features:
- Normalizes Unicode (NFKC) and trims control characters
- Removes bracketed numeric citations like [1], [12a], [3-4]
- Removes obvious paratext markers like [ILLUSTRATION], (NOTE), etc. (configurable)
- Keeps common punctuation; replaces unknown symbols with spaces
- Collapses excessive whitespace while preserving paragraphs
- Emits chunks (≤ chunk-size) preferring sentence/word boundaries

Usage:
  python scripts/clean_and_chunk.py --in raw_content --out cleaned_chunks.txt \
         --chunk-size 384 --overlap 0

You can then copy chunks from the output file into your /content/*.md files.
"""
from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path
from typing import List


BRACKETED_NUM_RE = re.compile(r"\[\s*\d+[\w\-]*\s*\]")
PAREN_PAGEREF_RE = re.compile(r"\(\s*p(?:p\.)?\.?\s*\d+[\-–]?\d*\s*\)", re.IGNORECASE)
BRACKETED_PARATEXT_RE = re.compile(r"\[(?:[A-Z][A-Z\s\-]{1,40})\]")  # e.g., [ILLUSTRATION]
PAREN_PARATEXT_RE = re.compile(r"\((?:[A-Z][A-Z\s\-]{1,40})\)")      # e.g., (NOTE)
# Bracketed page references like [Pg 12], [Pg. 154], possibly split by whitespace/newlines
BRACKETED_PG_RE = re.compile(r"\[\s*P(?:g|G)\.?\s*\d+(?:[\-–]\d+)?\s*\]", re.IGNORECASE)
# Bracketed numeric ranges with optional decimals on either side, e.g., [2-15], [2.1-15], [2-15.5], [2.1–15.5]
BRACKETED_NUMERIC_RANGE_RE = re.compile(r"\[\s*\d+(?:\.\d+)?\s*[\-–]\s*\d+(?:\.\d+)?\s*\]")
# Bracketed decimal markers like [12.34], [3.1415] (any number of decimals)
BRACKETED_DECIMAL_RE = re.compile(r"\[\s*\d+\.\d+\s*\]")
EXPER_MARK_RE = re.compile(r"(?mi)\bExper\.\s*\d+\.?\s*")

# Chapter headings like 'CHAPTER I', 'CHAPTER XII.', optionally followed by punctuation and a title
CHAPTER_MARK_RE = re.compile(r"(?mi)^\s*CHAPTER\s+[IVXLCDM]+\.?\s*(?:[:.-]\s*)?")

# Generic uppercase heading lines (e.g., AXIOMS., PROPOSITIONS., FOOTNOTES:)
UPPER_HEADING_LINE_RE = re.compile(r"(?m)^\s*[A-Z][A-Z\s\.:\-]{1,60}$")

# Start-of-line heading prefixes to strip while keeping any trailing title text
START_HEADING_PREFIX_RE = re.compile(
    r"(?mi)^\s*(?:BOOK|SECTION|SECT\.|PART|CHAP\.|PROPOSITIONS?|AXIOMS?|FOOTNOTES?|PREFACE|INTRODUCTION|APPENDIX)\.?\s*(?:[IVXLCDM]+|\d+)?\.?\s*(?:[:\-–]\s*)?"
)

# Start-of-line scholarly label prefixes to strip (keep the sentence that follows)
LABEL_PREFIX_RE = re.compile(
    r"(?mi)^\s*(?:AX\.|PROP\.|PROPOSITION(?:S|\.)?|THEOR\.|THEOREM\.|DEF\.|DEFIN\.|SCHOL\.|SCHOLIUM\.|ILLUSTR\.|ILLUSTRATION\.|CASE\.|Cas\.|CAS\.)\s*(?:[IVXLCDM]+|\d+)?\.?\s*(?:[:\-–]\s*)?"
)

# Bracketed single-letter footnote markers like [A], [B]
BRACKETED_LETTER_FOOTNOTE_RE = re.compile(r"(?mi)\[\s*[A-Z]\s*\]")

# Numeric section markers at start of a line, e.g., '1.' .. '920.' possibly followed by spaces.
# Also handle leading section symbols like '§' or '¶' before the number (with or without space).
SECTION_NUMBER_PREFIX_RE = re.compile(r"(?m)^\s*(?:[§¶]\s*)?\d{1,4}\.(?:\s+|$)")

# Figure references like "Fig. 7.", "Figs. 3-4", and bracketed/parenthetical variants like
# "[in Fig. 3.]" or "(Fig. 12)". We remove these tokens entirely.
FIG_INLINE_RE = re.compile(
    r"(?mi)(?:\bin\s+)?\bfigs?\.?\s*\d+(?:\s*[,–-]\s*\d+)*(?:\s*[a-z])?\.?"
)
FIG_BRACKETED_RE = re.compile(
    r"(?mi)\[\s*(?:in\s+)?figs?\.?\s*\d+(?:\s*[,–-]\s*\d+)*(?:\s*[a-z])?\s*\.?\s*\]"
)
FIG_PAREN_RE = re.compile(
    r"(?mi)\(\s*(?:in\s+)?figs?\.?\s*\d+(?:\s*[,–-]\s*\d+)*(?:\s*[a-z])?\s*\.?\s*\)"
)

# Safety: if any partial tokens like 'ig. 12' slip through (rare artifact), drop them too.
FIG_ARTIFACT_RE = re.compile(r"(?mi)\big\.?\s*\d+(?:\s*[,–-]\s*\d+)*(?:\s*[a-z])?\.?\b")

# Content-specific heading/marker cleanup
# Remove lines like 'DEFINITIONS' and strip enumeration prefixes with Roman numerals
HEADING_DEFINITIONS_RE = re.compile(r"(?mi)^\s*DEFINITIONS\s*$")

# Remove specific prefixes followed by Roman numerals (optionally with trailing '.')
# We limit scope to known scholarly markers to avoid stripping natural 'I.' pronoun cases.
ROMAN = r"[IVXLCDM]+"  # Roman numerals
PREFIX_ROMAN_PATTERNS = [
    re.compile(rf"(?i)\bDEFIN\.\s*{ROMAN}\.?") ,  # remove whole DEFIN. + numeral
    re.compile(rf"(?i)\bAX\.\s*{ROMAN}\.?")    ,  # keep 'AX.' but drop numeral later
    re.compile(rf"(?i)\bPROP\.\s*{ROMAN}\.?")  ,
    re.compile(rf"(?i)\bTHEOR\.\s*{ROMAN}\.?") ,
]

# Simple sentence boundary heuristic
SENT_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")

# Allowed punctuation (kept as-is after normalization)
ALLOWED_PUNCT = set(".,;:!?-'\"()[]—–/&_ %")

# Standalone image placeholder lines like 'image3' (from OCR or scraped content)
IMAGE_TOKEN_RE = re.compile(r"(?mi)^\s*image\d+\s*$")


def normalize(text: str) -> str:
    # Unicode normalize and map control chars to space
    t = unicodedata.normalize("NFKC", text)
    t = "".join(ch if (ch.isprintable() or ch in "\n\t") else " " for ch in t)
    return t


def strip_references_and_paratext(text: str) -> str:
    t = BRACKETED_NUM_RE.sub("", text)
    t = PAREN_PAGEREF_RE.sub("", t)
    t = BRACKETED_PG_RE.sub("", t)
    t = BRACKETED_NUMERIC_RANGE_RE.sub("", t)
    t = BRACKETED_DECIMAL_RE.sub("", t)
    t = BRACKETED_LETTER_FOOTNOTE_RE.sub("", t)
    t = BRACKETED_PARATEXT_RE.sub("", t)
    t = PAREN_PARATEXT_RE.sub("", t)
    # Remove standalone 'DEFINITIONS' lines
    t = HEADING_DEFINITIONS_RE.sub("", t)
    # Remove 'Exper. N.' markers
    t = EXPER_MARK_RE.sub("", t)
    # Strip 'CHAPTER <ROMAN>' headings (keep any trailing title text)
    t = CHAPTER_MARK_RE.sub("", t)
    # Remove uppercase heading-only lines and heading prefixes
    t = UPPER_HEADING_LINE_RE.sub("", t)
    t = START_HEADING_PREFIX_RE.sub("", t)
    # Remove label prefixes like AX., PROP., THEOR., Cas., Illustration., Scholium.
    t = LABEL_PREFIX_RE.sub("", t)
    # Remove numeric section markers at line starts
    t = SECTION_NUMBER_PREFIX_RE.sub("", t)
    # Remove 'imageN' placeholder lines entirely
    t = IMAGE_TOKEN_RE.sub("", t)
    # Remove figure references (inline, bracketed, and parenthetical)
    t = FIG_BRACKETED_RE.sub("", t)
    t = FIG_PAREN_RE.sub("", t)
    t = FIG_INLINE_RE.sub("", t)
    t = FIG_ARTIFACT_RE.sub("", t)
    # Remove specific prefixes + Roman numerals
    # - For DEFIN., drop the whole prefix token along with the numeral
    # - For AX., PROP., THEOR., first remove the numeral, then normalize spacing
    # Apply DEFIN. first to fully remove that marker
    t = re.compile(rf"(?i)\bDEFIN\.\s*{ROMAN}\.?").sub("", t)
    # For the rest, replace with just the plain prefix without numeral
    t = re.compile(rf"(?i)\bAX\.\s*{ROMAN}\.?").sub("AX.", t)
    t = re.compile(rf"(?i)\bPROP\.\s*{ROMAN}\.?").sub("PROP.", t)
    t = re.compile(rf"(?i)\bTHEOR\.\s*{ROMAN}\.?").sub("Theor.", t)
    return t


def strip_strange_chars(text: str, preserve_unicode: bool = False) -> str:
    if preserve_unicode:
        return text
    out_chars: List[str] = []
    for ch in text:
        if ch.isalpha() or ch.isdigit() or ch.isspace() or ch in ALLOWED_PUNCT:
            out_chars.append(ch)
        else:
            out_chars.append(" ")
    return "".join(out_chars)


def tidy_whitespace(text: str) -> str:
    # Collapse 3+ newlines to 2; collapse internal spaces
    t = re.sub(r"[ \t\x0b\r\f]+", " ", text)
    t = re.sub(r"\s*\n\s*\n\s*\n+", "\n\n", t)
    # Trim spaces around newlines
    t = re.sub(r" *\n *", "\n", t)
    # Remove multiple blank lines introduced by marker stripping
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def split_sentences(text: str) -> List[str]:
    # Fast path: if very long paragraph, split into sentences
    parts = SENT_SPLIT_RE.split(text)
    # Re-attach trailing punctuation if lost (conservative)
    return [p.strip() for p in parts if p and p.strip()]


def chunk_text(text: str, size: int = 384, overlap: int = 0) -> List[str]:
    # Prefer sentence boundaries; if a sentence exceeds size, split by words.
    chunks: List[str] = []
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        sents = split_sentences(para)
        buf = ""
        for s in sents:
            # If a single sentence is longer than size, flush current buf and split by words
            if len(s) > size:
                if buf:
                    chunks.append(buf)
                    buf = ""
                words = s.split()
                curr = ""
                for w in words:
                    candidate = (curr + " " + w).strip() if curr else w
                    if len(candidate) <= size:
                        curr = candidate
                    else:
                        if curr:
                            chunks.append(curr)
                        curr = w
                if curr:
                    buf = curr  # start next chunk with remainder of this long sentence
                continue

            # Normal case: try to append sentence to current buf
            candidate = (buf + " " + s).strip() if buf else s
            if len(candidate) <= size:
                buf = candidate
            else:
                # flush current buf as a chunk
                if buf:
                    chunks.append(buf)
                # start new buf with this sentence (no duplication, no overlap by default)
                buf = s
        # flush any remaining buffer for the paragraph
        if buf:
            chunks.append(buf)
            buf = ""
    return [c.strip() for c in chunks if c and c.strip()]


def process(raw: str, preserve_unicode: bool) -> str:
    t = normalize(raw)
    t = strip_references_and_paratext(t)
    t = strip_strange_chars(t, preserve_unicode=preserve_unicode)
    t = tidy_whitespace(t)
    return t


def main() -> int:
    ap = argparse.ArgumentParser(description="Clean and chunk a raw content file.")
    ap.add_argument("--in", dest="inp", default="raw_content", help="Path to input file (default: raw_content)")
    ap.add_argument("--out", dest="out", default="cleaned_chunks.txt", help="Path to output file")
    ap.add_argument("--chunk-size", dest="chunk_size", type=int, default=384, help="Chunk size (characters)")
    ap.add_argument("--overlap", dest="overlap", type=int, default=0, help="Optional character overlap between chunks")
    ap.add_argument("--preserve-unicode", action="store_true", help="Keep all Unicode characters (no filtering)")
    ap.add_argument("--delimiter", dest="delimiter", default="***", help="Line written between chunks to mark boundaries (default: ***)")
    ap.add_argument("--no-delimiter", dest="no_delimiter", action="store_true", help="If set, do not write any delimiter or blank line between chunks.")
    args = ap.parse_args()

    inp = Path(args.inp)
    if not inp.exists():
        print(f"[error] Input file not found: {inp}", file=sys.stderr)
        return 1

    raw = inp.read_text(encoding="utf-8", errors="ignore")
    cleaned = process(raw, preserve_unicode=args.preserve_unicode)
    chunks = chunk_text(cleaned, size=args.chunk_size, overlap=args.overlap)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        for idx, ch in enumerate(chunks, start=1):
            # Write chunks separated by a simple delimiter to make boundaries obvious.
            # No numeric headers, and not the previous '---' or '## chunk N'.
            if idx > 1:
                if not args.no_delimiter:
                    f.write(args.delimiter + "\n")
                else:
                    f.write("\n")
            f.write(ch.strip() + "\n")

    print(f"[ok] Wrote {len(chunks)} chunks → {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
