#!/bin/bash
# One-time setup: copies core.yaml/orderer.yaml templates from your
# fabric-samples install and patches core.yaml so the peer knows how to
# talk to chaincode running as a plain process (Chaincode-as-a-Service,
# "ccaas") instead of building/launching a Docker container for it.
#
# Usage: ./00-patch-core-yaml.sh /absolute/path/to/fabric-samples
set -e
cd "$(dirname "$0")/.."   # → blockchain/network

FABRIC_SAMPLES="$1"
if [ -z "$FABRIC_SAMPLES" ] || [ ! -d "$FABRIC_SAMPLES" ]; then
  echo "Usage: $0 /absolute/path/to/fabric-samples"
  exit 1
fi

mkdir -p config
cp "$FABRIC_SAMPLES/config/core.yaml"    config/core.yaml
cp "$FABRIC_SAMPLES/config/orderer.yaml" config/orderer.yaml

CCAAS_BUILDER_PATH="$FABRIC_SAMPLES/builders/ccaas"
if [ ! -d "$CCAAS_BUILDER_PATH" ]; then
  echo "✗ $CCAAS_BUILDER_PATH not found. It ships with fabric-samples — re-run install-fabric.sh with the 'samples' flag."
  exit 1
fi

python3 - "$CCAAS_BUILDER_PATH" << 'EOF'
import sys, re
ccaas_path = sys.argv[1]
with open('config/core.yaml') as f:
    content = f.read()

patch = f"""externalBuilders:
    - path: {ccaas_path}
      name: ccaas_builder
      propagateEnvironment:
        - CHAINCODE_AS_A_SERVICE_BUILDER_CONFIG"""

if 'name: ccaas_builder' in content:
    print("core.yaml already patched, skipping.")
else:
    new_content = re.sub(r'externalBuilders:\s*\[\]', patch, content, count=1)
    if new_content == content:
        print("⚠ Could not find 'externalBuilders: []' in core.yaml to patch automatically.")
        print("  Open blockchain/network/config/core.yaml yourself and add under `chaincode:`:")
        print(patch)
    else:
        with open('config/core.yaml', 'w') as f:
            f.write(new_content)
        print("✓ core.yaml patched with ccaas_builder external builder.")
EOF
