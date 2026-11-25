const fs = require('fs');
const path = require('path');

/**
 * Build do backend na Vercel (`npm run vercel-build`, chamado pelo vercel.json).
 *
 * Roda as migrations SO no deploy de producao. Os deploys de preview (de
 * qualquer outra branch) usam as mesmas variaveis de banco por padrao, e uma
 * branch com migration nova nao pode mexer no banco de producao antes de
 * entrar na main.
 */

// Projeto sem framework na Vercel precisa de uma pasta de saida, mesmo vazia:
// a API sai de api/, nao daqui.
fs.mkdirSync(path.join(__dirname, '..', 'public'), { recursive: true });

async function migrar() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(
      `[vercel-build] deploy "${process.env.VERCEL_ENV ?? 'local'}": migrations puladas.`
    );
    return;
  }

  const knex = require('knex')(require('../knexfile').migracao);
  try {
    const [lote, arquivos] = await knex.migrate.latest();
    console.log(
      arquivos.length
        ? `[vercel-build] lote ${lote}: ${arquivos.join(', ')}`
        : '[vercel-build] banco ja estava em dia.'
    );
  } finally {
    await knex.destroy();
  }
}

migrar().catch((erro) => {
  console.error('[vercel-build] migration falhou; o deploy para aqui.', erro);
  process.exit(1);
});
