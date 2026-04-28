# Deploy fase NN — bug fix "posiblemente caducado" + features

## Tarball preparado

URL pública (catbox, expira en 30 días si no se accede): https://files.catbox.moe/7dqybg.tgz
Contenido (11 archivos, 68KB):
- `tripcazador-web/src/lib/seed_diversifier.ts` — clamp 22h + sortByFeaturedRanking (FIX BUG)
- `tripcazador-web/src/lib/comparisons.ts` — +5 comparativas (40→45)
- `tripcazador-web/src/lib/airports_catalog.ts` — 272 aeropuertos (123→272)
- `tripcazador-web/src/components/AirportCombobox.tsx` — dropdown 18 (era 8)
- `tripcazador-web/src/app/deals/page.tsx` — filtro frescura
- `tripcazador-web/src/content/blog/*.mdx` — 4 blog posts long-tail
- `EMAIL_ROUTING_SETUP.md` + `ROADMAP_DAY2_DAY3.md`

## Pasos en Cloud Shell (Ernesto, 30s)

Abre la pestaña **Cloud Shell** que ya tienes abierta y pega esto:

```bash
cd ~ && [ -d tripcazador ] || git clone https://github.com/ERNESTOTALIB/tripcazador.git
cd ~/tripcazador && git pull --rebase origin main \
  && curl -sL https://files.catbox.moe/7dqybg.tgz | tar xz \
  && git add -A \
  && git commit -m "fase nn: fix featured deals 'posiblemente caducado' + freshness filter + 5 comparativas + 4 blog posts + airports 272 + email routing docs" \
  && git push origin main \
  && echo "==> push OK, Vercel auto-deploy disparado por workflow vercel-deploy.yml"
```

## Qué pasa después

1. `git push` dispara el workflow `vercel-deploy.yml` en GitHub Actions
2. Vercel construye y despliega prod en ~3-5 min
3. https://tripcazador.com pierde el chip "Posiblemente caducado" en home
4. https://tripcazador.com/deals gana los tabs "🟢 Frescos (24h) / 🔥 Hoy (8h)"
5. https://tripcazador.com/comparar tiene 45 comparativas en vez de 40
6. https://tripcazador.com/blog tiene 58 posts en vez de 54

## Verificar deploy

```bash
# desde Cloud Shell o tu máquina:
curl -s https://tripcazador.com/api/deals | jq '.deals[0] | {origin, destination, found_at, score}'
# debe mostrar un deal con found_at de las últimas 24h
```

## Si git push falla por auth

Cloud Shell usa GIT_ASKPASS por default. Si pide credenciales:
1. **GH PAT**: Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token con scope `repo`
2. Pega el token cuando git pida password (username = ERNESTOTALIB)
3. Persistir: `git config --global credential.helper store` (lo guarda en `~/.git-credentials` en Cloud Shell)
