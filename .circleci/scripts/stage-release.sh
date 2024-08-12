#!/bin/bash

# Get the latest tag from the repository
latest_tag=$(git describe --tags --abbrev=0)

# If there are no tags, start with v0.1.0
if [ -z "$latest_tag" ]; then
  new_tag="v0.1.0.rc1-stage"
else
  # Check if the tag contains an rc version
  # the rc version means either the prod release is not deployed yet or it's a hotfix
  if [[ $latest_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)\.rc([0-9]+)(-stage)?$ ]]; then
    major=${BASH_REMATCH[1]}
    minor=${BASH_REMATCH[2]}
    patch=${BASH_REMATCH[3]}
    rc=${BASH_REMATCH[4]}
    rc=$((rc + 1))

    # Create the new tag with bumped rc version
    new_tag="v${major}.${minor}.${patch}.rc${rc}-stage"
  elif [[ $latest_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    major=${BASH_REMATCH[1]}
    minor=${BASH_REMATCH[2]}
    patch=${BASH_REMATCH[3]}
    if [[ $1 == "--hotfix" ]]; then
      patch=$((patch + 1))
      new_tag="v${major}.${minor}.${patch}.rc1-stage"
    else 
      # Create the new tag with bumped minor version
      minor=$((minor + 1))
      new_tag="v${major}.${minor}.0.rc1-stage"
    fi
  else
    echo "The latest tag does not follow the expected format: vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH.rcRC-stage"
    exit 1
  fi
fi

echo "New tag: $new_tag, previous tag: $latest_tag"

release_data=$(cat <<EOF
{
  "tag_name": "$new_tag",
  "target_commitish": "$CIRCLE_SHA1",
  "name": "$new_tag",
  "prerelease": true,
  "generate_release_notes": true
}
EOF
)

echo "Release data: $release_data"

curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/releases \
  -d "$release_data"
