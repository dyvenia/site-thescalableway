# How to Use the Markdown Fix Script (`fix_md.py`)

This guide explains how to prepare and use a Python script that processes a Markdown (`.md`) file and escapes raw Jinja-style double curly brackets (`{{`, `}}`) to avoid template rendering issues in Sveltia.

---

## Prerequisites

Before using the script, make sure you have the following:

- Python 3.x Installed

    You need **Python 3 or newer** installed on your system.
    Download it from the official website: [https://www.python.org/](https://www.python.org/downloads/windows/) (Choose Windows installer (64-bit))

    During installation, make sure to check the option:  
    **✔ Add Python to PATH**

---

## Preparing the Script and Environment

### 1. Open PowerShell on Desktop

Open PowerShell and move to the Desktop using:

```powershell
cd .\Desktop\
```

### 2. Save the Script

1. In PowerShell, run:

    ```
    New-Item fix_md.py -ItemType File
    ```

2. Open the file for example in Notepad.
3. Paste the full content of the `fix_md.py` script and save (CTRL + S).

### 3. Create an Empty Markdown File

In PowerShell, run:

```
New-Item text.md -ItemType File
```

This will create a new empty file `text.md` on your Desktop.

### 4. Add Content to the Markdown File

Double-click text.md on your Desktop and paste in the Markdown content you'd like to process. For example:
```
registry: ${{ inputs.registry }}
raw block: {{ something }}
already escaped: {{ '{{' }} safe {{ '}}' }}
```

Save and close the file.

### 5. Running the Script

With PowerShell still in the Desktop directory, run:

```
python .\fix_md.py .\text.md
```

### 6. Output

The script will:
- Read text.md
- Detect and escape raw {{ and }} signs to prevent accidental errors in rendering
- Ignore already-escaped cases like {{ '{{' }} or {{ '}}' }} -> you can run script on the same file several times without changing any of the characters that already are correct
- Write the result to a new file: `text_fixed.md` on your Desktop
