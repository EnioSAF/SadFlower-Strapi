# Strapi 5 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer SadFlower-Strapi de Strapi 4.24.2 vers la dernière version stable Strapi 5 sans casser les APIs existantes.

**Architecture:** Utiliser l’outil officiel `@strapi/upgrade`, puis aligner les dépendances et adapter uniquement les extensions/configurations incompatibles. Retirer les plugins Strapi 4 non utilisés si aucune configuration ou logique du dépôt n’en dépend.

**Tech Stack:** Node.js 22, npm, Strapi 5, SQLite local, PostgreSQL production, AWS S3.

## Global Constraints

- Travailler uniquement dans `SadFlower-Strapi` sur `chore/strapi-5-upgrade`.
- Conserver les APIs `blog`, `sad-gotchu` et l’extension users-permissions.
- Conserver la compatibilité SQLite locale, PostgreSQL/S3 en production.
- Ne pas implémenter MyWork.exe pendant cette migration.
- Vérification finale obligatoire avec `npm run build`.

---

### Task 1: Audit et migration des dépendances

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Confirmer les dépendances réellement utilisées avec `rg`.
- [ ] Exécuter `npx @strapi/upgrade latest`.
- [ ] Retirer ou remplacer uniquement les plugins sans version Strapi 5 et sans usage applicatif.
- [ ] Exécuter `npm install` et vérifier `npm ls --depth=0`.

### Task 2: Compatibilité du code et des configurations

**Files:**
- Modify si requis: `config/*.js`
- Modify si requis: `src/extensions/users-permissions/strapi-server.js`
- Modify si requis: `src/api/**`

- [ ] Lancer `npm run build` pour obtenir les erreurs exactes.
- [ ] Adapter les ruptures Strapi 5 minimales, sans refactor hors périmètre.
- [ ] Régénérer les types produits par Strapi si nécessaire.

### Task 3: Vérification finale

**Files:**
- Inspect: `package.json`, `package-lock.json`, fichiers migrés

- [ ] Exécuter `npm run build` depuis un état propre.
- [ ] Vérifier `git diff --check`, `git status --short` et le diff complet.
- [ ] Documenter les plugins retirés et les risques de migration de données.
