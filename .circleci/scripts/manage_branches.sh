#!/bin/sh
# Ensure we're on the 'dev' branch
git checkout dev

# Fetch all branches
git fetch --all --prune   

echo "Found release branches: $(git branch -r | grep 'origin/release/' | sed 's/origin\///')"
# Identify and handle all release branches
git branch -r | grep 'origin/release/' | sed 's/origin\///' | while read RELEASE_BRANCH; do
    echo "Processing branch: $RELEASE_BRANCH"

    # Trim whitespace
    RELEASE_BRANCH=$(echo $RELEASE_BRANCH | xargs)

    if [ -z "$RELEASE_BRANCH" ]; then
        echo "No release branch found, skipping..."
        continue
    fi

    echo "Working with release branch: $RELEASE_BRANCH"

    # Ensure the release branch is fully fetched
    git fetch origin $RELEASE_BRANCH:$RELEASE_BRANCH

    UNMERGED_COMMITS=$(git log dev..$RELEASE_BRANCH --oneline)
    if [ ! -z "$UNMERGED_COMMITS" ]; then
        # There are unmerged commits. Create an archive branch.
        ARCHIVE_BRANCH_NAME="archive/${RELEASE_BRANCH#release/}" 
        git checkout -b $ARCHIVE_BRANCH_NAME $RELEASE_BRANCH
        git push origin $ARCHIVE_BRANCH_NAME
        echo "Created archive branch: $ARCHIVE_BRANCH_NAME"
        
        # Attempt to merge the archive branch into dev
        git checkout dev
        if git merge --no-ff --no-commit $ARCHIVE_BRANCH_NAME; then
            echo "Successfully merged $ARCHIVE_BRANCH_NAME into dev."
            git commit -m "auto: Merge archive branch $ARCHIVE_BRANCH_NAME into dev"
            git push origin dev
            
            # Delete the archive branch since merge was successful
            git branch -d $ARCHIVE_BRANCH_NAME
            git push origin --delete $ARCHIVE_BRANCH_NAME
            echo "Deleted archive branch: $ARCHIVE_BRANCH_NAME since it was successfully merged into dev." 
        else
            echo "Merge conflict detected. Aborting merge. Create a manual PR from $ARCHIVE_BRANCH_NAME to dev"
            git merge --abort
        fi
    fi 

    # Switch back to dev before deleting the local copy of the release branch
    git checkout dev

    # Delete the release branch locally
    git branch -D $RELEASE_BRANCH

    # Delete the release branch remotely
    git push origin --delete $RELEASE_BRANCH
    echo "Deleted release branch: $RELEASE_BRANCH"
done