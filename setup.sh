#!/usr/bin/env bash
# Crea el monorepo de Ruta Segura y publica el "Initial commit" en GitHub.
#
# Uso:  ./setup.sh [nombre-repo] [--public]
# Por defecto crea un repositorio PRIVADO llamado "ruta-segura".
# Requisitos: git, gh (GitHub CLI) y haber ejecutado `gh auth login`.
set -euo pipefail

REPO="ruta-segura"
VISIBILIDAD="--private"
for arg in "$@"; do
  case "$arg" in
    --public)  VISIBILIDAD="--public" ;;
    --private) VISIBILIDAD="--private" ;;
    -*)        echo "Opción desconocida: $arg" >&2; exit 1 ;;
    *)         REPO="$arg" ;;
  esac
done

cd "$(dirname "$0")"

command -v git >/dev/null || { echo "Falta git." >&2; exit 1; }
command -v gh  >/dev/null || { echo "Falta GitHub CLI: https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Ejecuta primero: gh auth login" >&2; exit 1; }

mkdir -p client server

if [ ! -f .gitignore ]; then
  cat > .gitignore <<'GITIGNORE'
# Dependencias
node_modules/

# Secretos: nunca versionar (.env.example sí se versiona)
.env
.env.*
!.env.example
*.pem
*.key

# Base de datos local (contiene datos personales, Ley 1581 de 2012)
*.db
*.db-journal
*.db-wal
*.db-shm
*.sqlite
*.sqlite3
server/data/

# Build y cobertura
dist/
build/
coverage/
.vite/

# Logs
logs/
*.log
npm-debug.log*

# Sistema operativo y editores
.DS_Store
Thumbs.db
desktop.ini
.idea/
.vscode/
.claude/
*.swp
GITIGNORE
fi

[ -d .git ] || git init -b main

git add -A

# Última barrera: abortar si un secreto o la base de datos quedaron preparados.
if git diff --cached --name-only | grep -E '(^|/)\.env$|(^|/)\.env\.[^/]*$|\.db$|\.sqlite3?$' | grep -v '\.env\.example$'; then
  echo "Abortado: los archivos anteriores no deben versionarse." >&2
  exit 1
fi

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  git diff --cached --quiet || git commit -m "Actualiza el monorepo de Ruta Segura"
else
  git commit -m "Initial commit" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin HEAD
else
  gh repo create "$REPO" "$VISIBILIDAD" --source=. --remote=origin --push \
    --description "Reporte colaborativo de zonas de riesgo nocturno para mujeres en Cundinamarca"
fi

echo "Listo: $(git remote get-url origin)"
