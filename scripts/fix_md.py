import sys
import logging
from pathlib import Path

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

def protect_correct_brackets(content: str) -> str:
    content = content.replace("{{ '{{' }}", "[[LEFT-HAND_SINGS_OK]]")
    content = content.replace("{{ '}}' }}", "[[RIGHT-HAND_SINGS_OK]]")

    content = content.replace("{{", "[[LEFT-HAND_SINGS_OK]]")
    content = content.replace("}}", "[[RIGHT-HAND_SINGS_OK]]")

    content = content.replace("[[LEFT-HAND_SINGS_OK]]", "{{ '{{' }}")
    content = content.replace("[[RIGHT-HAND_SINGS_OK]]", "{{ '}}' }}")

    return content

def log_line_differences(original: str, modified: str):
    original_lines = original.splitlines()
    modified_lines = modified.splitlines()

    logger.info("Checking for modified lines...")
    changed_lines = []

    for idx, (orig, mod) in enumerate(zip(original_lines, modified_lines), start=1):
        if orig != mod:
            logger.info(f"Line {idx} changed:")
            logger.info(f"  - Before: {orig}")
            logger.info(f"  - After : {mod}")
            changed_lines.append(idx)

    if len(original_lines) != len(modified_lines):
        logger.warning("Line count mismatch between original and modified content. Some changes may not be listed.")

    if not changed_lines:
        logger.info("No changes detected.")
    else:
        logger.info(f"Total lines changed: {len(changed_lines)}")

def main():
    if len(sys.argv) != 2:
        logger.error("Usage: python fix_md.py <filename.md>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.is_file():
        logger.error(f"File '{input_path}' does not exist.")
        sys.exit(1)

    output_path = input_path.with_name(input_path.stem + "_fixed.md")

    logger.info(f"Reading file: {input_path.name}")
    original_content = input_path.read_text(encoding='utf-8')
    updated_content = protect_correct_brackets(original_content)
    output_path.write_text(updated_content, encoding='utf-8')
    logger.info(f"Updated file written to: {output_path.name}")

    log_line_differences(original_content, updated_content)

if __name__ == "__main__":
    main()
