#!/bin/bash
cd "$(dirname "$0")/.."
./scripts/wait-for-localstack.sh
./scripts/terraform-init.sh