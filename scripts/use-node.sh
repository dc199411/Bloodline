#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_DIR="$ROOT_DIR/.toolchain/node-v20.19.5/bin"

export PATH="$NODE_DIR:$PATH"
export COREPACK_HOME="$ROOT_DIR/.toolchain/corepack"

exec "$@"
