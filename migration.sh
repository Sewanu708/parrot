#!/bin/env bash

set -euo pipefail

ENTITY_PATTERN="packages/db/src/schema.ts"
MIGRATIONS_PATH="packages/db/drizzle"

#get staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

ANY_CHANGES=$(echo "$STAGED" | grep "$ENTITY_PATTERN" || true })

if [ -z "$ANY_CHANGES" ]; then
    echo "No schema changes"
    exit 0
fi

echo ""
echo "Schema changes detected:"
echo "$ANY_CHANGES" | sed 's/^/   /'
echo ""

IS_STAGED=$(echo "$STAGED" | grep "$MIGRATION_PATH" || true)

if [ -z "$IS_STAGED" ]; then
    echo "ERROR: Entity files were modified but no migration file was staged."
    echo ""
    echo "   Run the following to generate one:"
    echo ""
    echo "     pnpm db:migrate"
    echo ""
    echo "   Then stage the generated migration file(s) and commit again."
    echo ""
    exit 1
fi

echo "Migration files staged"
echo "$IS_STAGED" | sed 's/^/  /'
