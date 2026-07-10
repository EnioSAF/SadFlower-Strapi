# MyWork Requests API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une API publique Strapi 5, limitée à la création de demandes MyWork.exe consultables dans l’admin.

**Architecture:** Une route custom POST délègue validation, anti-spam et idempotence à un service. La collection `work-request` ne publie aucune route CRUD et tous les champs de contact restent privés pour la Content API.

**Tech Stack:** Strapi 5.50.1, Node 22, Node test runner, SQLite local, PostgreSQL production.

## Global Constraints

- Endpoint unique : `POST /api/my-work/requests`, `auth: false`.
- Ne jamais renvoyer coordonnées, contenu, statut interne ou identifiants Strapi.
- Rejeter champs inconnus ; consentement strictement `true` ; honeypot silencieux.
- Limiter à 5 demandes/10 minutes/IP et 20/jour/IP, avec IP HMAC-SHA256.
- Catalogue lu depuis `MYWORK_SERVICE_CATALOG`; aucun code de service inventé.
- Vérifier avec `node --test test/mywork/*.test.js` puis `npm run build`.

---

### Task 1: Validation testable

**Files:**
- Create: `test/mywork/request-validation.test.js`
- Create: `src/api/work-request/services/request-validation.js`

- [ ] Écrire les tests rouges pour payload valide, champs inconnus, consentement, email, service hors catalogue et honeypot.
- [ ] Implémenter validation/normalisation pure jusqu’au vert.

### Task 2: Persistance et endpoint

**Files:**
- Create: `src/api/work-request/content-types/work-request/schema.json`
- Create: `src/api/work-request/routes/work-request.js`
- Create: `src/api/work-request/controllers/work-request.js`
- Create: `src/api/work-request/services/work-request.js`

- [ ] Ajouter collection admin privée, route POST seule, références publiques et idempotence.
- [ ] Ajouter rate limit mémoire HMAC et enveloppes d’erreur stables.

### Task 3: Vérification et documentation

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] Ajouter script de test et variables d’environnement documentées.
- [ ] Lancer tests, génération de types et build Strapi.
