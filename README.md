# Aula 14 — Pipeline DevOps de Ponta a Ponta (A1 & A2)

API Node.js + PostgreSQL com testes (Jest/Supertest), CI no GitHub Actions, imagem Docker otimizada,
orquestração com Docker Compose e CD publicando no GHCR com versionamento semântico e rollback.

---

## O que foi corrigido em relação ao material da aula

| Arquivo | Problema no original | Correção |
| :--- | :--- | :--- |
| `server.js` | `/health` devolvia `{status:'OK'}`, mas o teste espera `'UP'` → **CI vermelho** | Devolve `{status:'UP'}` |
| `test/app.test.js` | Só 1 teste | +2 testes (content-type JSON e 404) |
| `Dockerfile` | Node 18 (CI usa 20), `npm install` com devDependencies, roda como root, copia tudo | `node:20-alpine`, `npm ci --omit=dev`, `USER node`, copia só `server.js`, `HEALTHCHECK` |
| `.dockerignore` | Faltavam `test/`, `.github/`, `coverage`, etc. | Contexto de build mínimo |
| `docker-compose.yml` | **Senha escrita no código**; API subia antes do banco ficar pronto | Senha vem do `.env`/secret; healthcheck no Postgres + `condition: service_healthy` |
| `ci-pipeline.yml` | `npm install` sem lockfile/cache | `npm ci` + cache npm; `workflow_call` para reuso |
| `cd-pipeline.yml` | Publicava imagem **mesmo com teste falhando**; tag `semver {{version}}` gera `1.0.0` (sem `v`), mas o rollback usa `v1.0.0`; job de deploy não fazia login para o pull; nome de imagem com maiúsculas quebra no GHCR | Testes como porta de qualidade; tag `v1.0.0` gerada (`type=ref,event=tag`); login no deploy; nome em minúsculas; cache de camadas (`type=gha`); smoke test |
| Roteiro de rollback | `echo ... > .env` **apagava** o `.env` inteiro; `>>` deixava `IMAGE_TAG` duplicado | Troca apenas a linha `IMAGE_TAG` com `sed` |

---

## Passo a passo

### 1. Integrar o código na `main`
1. (Opcional) Crie o segredo do banco em **Settings → Secrets and variables → Actions → New repository secret**,
   nome `DB_PASSWORD`. Se ele não existir, o pipeline gera uma senha aleatória para o ambiente efêmero —
   em nenhum caso há senha no código.
2. Abra o Pull Request da branch `feat/aula14-pipeline-cicd` → o CI roda no PR (check **Execução de Testes**).
3. Com o check verde, faça o **merge** na `main`.
4. Aba **Actions**: o CI e o CD devem ficar verdes. 📸 *Print para a evidência de CI e CD.*

### 2. Proteger a branch `main` (Trunk-Based)
**Settings → Branches → Add branch protection rule** (ou *Rulesets*), padrão `main`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass → selecione **Execução de Testes**
- ✅ Do not allow bypassing the above settings (opcional)

Fluxo Trunk-Based: branches curtas saindo da `main` e voltando por PR:
```bash
git checkout -b feat/novo-teste
# ...altera algo...
git commit -am "test: novo caso"
git push -u origin feat/novo-teste
# abra o PR no GitHub → CI roda → merge na main
```
📸 *Print da regra de proteção e de um PR com o check verde.*

### 3. Conferir a imagem no GHCR
No seu perfil do GitHub → **Packages** → `minha-api-devops`. Devem aparecer as tags `latest` e o SHA curto.
Para não precisar de login no pull local: **Package settings → Change visibility → Public**.

### 4. Release v1.0.0
```bash
git checkout main && git pull
git tag -a v1.0.0 -m "Release v1.0.0 - Fase 2 Concluída"
git push origin v1.0.0
```
Espere o CD ficar verde. No GHCR aparecerão as tags `v1.0.0` e `1.0.0`. 📸 *Print.*

### 5. Simular falha + rollback

**Automático:** a cada tag `v*.*.*` o job **Simulação de Falha e Rollback** do CD executa o roteiro abaixo
no GitHub Actions. O log aparece no resumo da execução (aba Actions) e fica salvo como artefato
`log-rollback-v1.0.0`. Uma cópia está em [`evidencias/log-rollback.txt`](evidencias/log-rollback.txt).

**Local (opcional):**
Requer Docker Desktop. No Windows use o **Git Bash**.
```bash
cp .env.example .env
# edite o .env: troque a senha
# se o pacote for privado: docker login ghcr.io -u luizlf07  (senha = token com read:packages)

# Sobe a versão estável e grava todo o log para a evidência
{
echo "=== Versão estável v1.0.0 ==="
docker compose pull
docker compose up -d --wait
docker compose ps
curl -s http://localhost:8009/health; echo

echo "=== Passo 2: Simulação de falha (tag inexistente) ==="
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=v999-erro/' .env
docker compose pull app
docker compose up -d app
docker compose ps

echo "=== Passo 3: Rollback para v1.0.0 ==="
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=v1.0.0/' .env
docker compose pull app
docker compose up -d --wait app
docker compose ps
curl -s http://localhost:8009/health; echo
} 2>&1 | tee log-rollback.txt
```
No Passo 2 deve aparecer um erro do tipo `manifest unknown` / `not found` — essa é a falha simulada.
No Passo 3 a API volta saudável. O arquivo **`log-rollback.txt`** é a evidência pedida.
Abra http://localhost:8009 para ver "Comunicação com sucesso!" com a data do banco.

Para desligar: `docker compose down` (ou `docker compose down -v` para apagar o volume do banco).

---

## Checklist de entrega

| Fase | Requisito | Onde está |
| :--- | :--- | :--- |
| A1 | Repositório Git / Trunk-Based | Passo 2 (regra de proteção + PR) |
| A1 | Código & Testes | `server.js`, `test/app.test.js` — `npm test` |
| A1 | Pipeline de CI | `.github/workflows/ci-pipeline.yml` verde |
| A2 | Dockerfile otimizado | `Dockerfile` + `.dockerignore` |
| A2 | Orquestração IaC | `docker-compose.yml` (API + PostgreSQL) |
| A2 | Pipeline de CD | `.github/workflows/cd-pipeline.yml` → `ghcr.io` |
| A2 | Gestão de segredos | `GITHUB_TOKEN` para o GHCR, `secrets.DB_PASSWORD` para o banco, `.env` no `.gitignore` |
| A2 | Versionamento & Rollback | tag `v1.0.0` + `log-rollback.txt` |

## Rodar os testes localmente
```bash
npm ci
npm test
```
