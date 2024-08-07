#!/bin/bash

# Get the latest tag from the repository
latest_tag=$(git describe --tags --abbrev=0)

# If there are no tags, start with v0.1.0
if [ -z "$latest_tag" ]; then
  new_tag="v0.1.0"
else
  # Extract the version numbers
  IFS='.' read -r -a version_parts <<< "${latest_tag}"

  major=${version_parts[0]}
  # Bump the minor version
  minor=${version_parts[1]}
  minor=$((minor + 1))

  # Create the new tag
  new_tag="${major}.${minor}.0.rc1-stage"

  echo "New tag: $new_tag, previous tag: $latest_tag"
fi

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
