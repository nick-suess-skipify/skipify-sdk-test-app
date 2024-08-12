#!/bin/bash

stage_tag=$CIRCLE_TAG

# If there are no stage tag, exit
if [ -z "$stage_tag" ]; then
  echo "No stage tag found"
  exit 1
fi

if [ -z "$CIRCLE_SHA1" ]; then
  echo "No CIRCLE_SHA1 found"
  exit 1
fi

# Check if the tag is valid
if [[ $stage_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)\.rc([0-9]+)(-stage)?$ ]]; then
  major=${BASH_REMATCH[1]}
  minor=${BASH_REMATCH[2]}
  patch=${BASH_REMATCH[3]}
  rc=${BASH_REMATCH[4]}

  # Create the new production tag without the rc version
  new_tag="v${major}.${minor}.${patch}"
else
  echo "The stage tag does not follow the expected format: vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH.rcRC-stage"
  exit 1
fi


echo "New production tag: $new_tag, stage tag: $stage_tag"

release_data=$(cat <<EOF
{
  "tag_name": "$new_tag",
  "target_commitish": "$CIRCLE_SHA1",
  "name": "$new_tag",
  "prerelease": false,
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
