# Auto-deploy

Cada push a `master` ejecuta `scripts/deploy/deploy.sh` en el VPS vía SSH.

## Setup inicial (una sola vez)

Genera un deploy key sin passphrase desde tu máquina:

```bash
ssh-keygen -t ed25519 -f vps-deploy -N "" -C "github-actions@planazosbcn"
```

Añade la clave pública al VPS:

```bash
ssh hetzner "cat >> ~/.ssh/authorized_keys" < vps-deploy.pub
```

Sube la clave privada y el host a GitHub secrets:

```bash
gh secret set VPS_HOST --body "78.46.100.91"
gh secret set VPS_USER --body "root"
gh secret set VPS_SSH_KEY < vps-deploy
```

Borra las copias locales del par de claves (ya están en el VPS y en GitHub):

```bash
rm vps-deploy vps-deploy.pub
```

## Probar

```bash
git commit --allow-empty -m "test: trigger deploy"
git push
```

Ver progreso en `Actions` del repo o con `gh run watch`.
