#!/usr/bin/env bash
set -euo pipefail

VENV_DIR=".venv"
REQ_FILE="requirements.txt"

if ! command -v python3 &> /dev/null; then
    echo "Error: python3 not found. Please install Python 3 first." >&2
    exit 1
fi

if [ ! -f "$REQ_FILE" ]; then
    echo "Error: '$REQ_FILE' not found in current directory ($(pwd))." >&2
    exit 1
fi

if [ -d "$VENV_DIR" ]; then
    echo "Virtual environment '$VENV_DIR' already exists. Skipping creation."
else
    echo "Creating virtual environment in './$VENV_DIR'..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing dependencies from $REQ_FILE..."
pip install -r "$REQ_FILE"

echo ""
echo "Done. Virtual environment is ready."
echo "To activate it later, run:"
echo "  source $VENV_DIR/bin/activate"