#!/bin/bash

latest_tag=$(git describe --tags --abbrev=0)

echo "Latest semantic version tag found: $latest_tag"

# Check if the tag contains an rc version
  # the rc version means either the prod release is not deployed yet or it's a hotfix
  if [[ $latest_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)\.rc([0-9]+)(-stage)?$ ]]; then
    major=${BASH_REMATCH[1]}
    minor=${BASH_REMATCH[2]}
    patch=${BASH_REMATCH[3]}
    rc=${BASH_REMATCH[4]}
    rc=$((rc + 1))

    # Create the new version with bumped rc version
    new_version="v${major}.${minor}.${patch}"
  elif [[ $latest_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    major=${BASH_REMATCH[1]}
    minor=${BASH_REMATCH[2]}
    patch=${BASH_REMATCH[3]}
    patch=$((patch + 1))
    
    # Create the new version with bumped patch version
    new_version="v${major}.${minor}.${patch}"
  else
    echo "The latest tag does not follow the expected format: vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH.rcRC-stage"
    exit 1
  fi

# Create a new branch from the commit tagged with the latest version
git checkout -b "release/${new_version}" "$latest_tag"

echo "Branch release/${new_version} created from tag ${latest_tag}"