#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DEPLOY_BRANCH=${DEPLOY_BRANCH:-hostinger-deploy}
DEPLOY_REMOTE=${DEPLOY_REMOTE:-origin}
WORKTREE_DIR=${WORKTREE_DIR:-"$ROOT_DIR/.hostinger-deploy-worktree"}

if [ ! -d "$ROOT_DIR/dist" ]; then
  echo "dist/ nao existe. Rode npm run build antes de publicar a branch." >&2
  exit 1
fi

EXISTING_WORKTREE=$(
  git -C "$ROOT_DIR" worktree list --porcelain | awk -v branch="refs/heads/$DEPLOY_BRANCH" '
    $1 == "worktree" { path = $2 }
    $1 == "branch" && $2 == branch { print path; exit }
  '
)

if [ -n "$EXISTING_WORKTREE" ]; then
  WORKTREE_DIR=$EXISTING_WORKTREE
else
  if [ -d "$WORKTREE_DIR" ]; then
    git -C "$ROOT_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || rm -rf "$WORKTREE_DIR"
  fi

  if git -C "$ROOT_DIR" show-ref --verify --quiet "refs/heads/$DEPLOY_BRANCH"; then
    git -C "$ROOT_DIR" worktree add "$WORKTREE_DIR" "$DEPLOY_BRANCH"
  else
    git -C "$ROOT_DIR" worktree add --detach "$WORKTREE_DIR"
    git -C "$WORKTREE_DIR" switch --orphan "$DEPLOY_BRANCH"
  fi
fi

find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

cp "$ROOT_DIR/.htaccess" "$WORKTREE_DIR/.htaccess"
cp "$ROOT_DIR/dist/index.html" "$WORKTREE_DIR/index.html"
cp "$ROOT_DIR/dist/favicon.svg" "$WORKTREE_DIR/favicon.svg"
cp "$ROOT_DIR/dist/robots.txt" "$WORKTREE_DIR/robots.txt"
cp "$ROOT_DIR/dist/sitemap.xml" "$WORKTREE_DIR/sitemap.xml"
cp -R "$ROOT_DIR/dist/assets" "$WORKTREE_DIR/assets"

mkdir -p "$WORKTREE_DIR/api/config"
mkdir -p "$WORKTREE_DIR/api/data"
cp "$ROOT_DIR/api/.htaccess" "$WORKTREE_DIR/api/.htaccess"
cp "$ROOT_DIR/api/index.php" "$WORKTREE_DIR/api/index.php"
cp "$ROOT_DIR/api/config/bootstrap.php" "$WORKTREE_DIR/api/config/bootstrap.php"
cp "$ROOT_DIR/api/config/config.example.php" "$WORKTREE_DIR/api/config/config.example.php"
cp "$ROOT_DIR/api/data/medication_guidance_rules.php" "$WORKTREE_DIR/api/data/medication_guidance_rules.php"

cat > "$WORKTREE_DIR/README.md" <<'DEPLOY_README'
# ALM Anestesia - Deploy

Esta branch contem somente os arquivos de producao para o Git Deploy da Hostinger.

Configure a Hostinger para publicar esta branch no diretorio `public_html`.
Nao coloque `api/config/config.php` nesta branch; esse arquivo deve existir apenas no servidor.
DEPLOY_README

git -C "$WORKTREE_DIR" add -A
if git -C "$WORKTREE_DIR" diff --cached --quiet; then
  echo "Nenhuma alteracao para publicar em $DEPLOY_BRANCH."
else
  git -C "$WORKTREE_DIR" commit -m "Deploy ALM Anestesia"
fi

echo "Branch preparada: $DEPLOY_BRANCH"
echo "Para enviar ao GitHub: git push $DEPLOY_REMOTE $DEPLOY_BRANCH"
