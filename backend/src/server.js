const { criarApp } = require('./app');
const ambiente = require('./config/ambiente');
const bancoDeDados = require('./config/banco');

// Abaixo dos 10s que o `docker stop` espera antes de mandar SIGKILL.
const PRAZO_DE_ENCERRAMENTO_MS = 8000;

/**
 * Ponto de entrada do processo. Faz tres coisas: confere que o banco responde,
 * sobe o HTTP e fecha tudo direito quando o container manda parar.
 */

async function iniciar() {
  // Falhar aqui e melhor do que aceitar requisicao e devolver 500 na primeira
  // consulta. Se o Postgres nao esta de pe, o servidor nao tem o que servir.
  try {
    await bancoDeDados.raw('SELECT 1');
  } catch (erro) {
    console.error('Nao foi possivel conectar ao banco de dados.');
    console.error('Verifique se o container subiu: docker compose ps');
    console.error(erro.message);
    process.exit(1);
  }

  const servidor = criarApp().listen(ambiente.porta, () => {
    console.log(`Diagrameria ouvindo em http://localhost:${ambiente.porta} [${ambiente.ambiente}]`);
  });

  // SIGTERM vem do `docker stop`; SIGINT do Ctrl+C. Nos dois casos: para de
  // aceitar conexao nova, espera as em andamento e so entao fecha o pool.
  let encerrando = false;
  const encerrar = (sinal) => () => {
    // Segundo Ctrl+C durante o encerramento: a pessoa quer sair agora.
    if (encerrando) process.exit(1);
    encerrando = true;
    console.log(`\n${sinal} recebido, encerrando...`);

    // Conexao keep-alive ociosa segura o close() para sempre. Fecha as ociosas
    // agora e, se alguma requisicao travar, desiste depois do prazo. O unref()
    // impede que o proprio timer segure o processo aberto.
    servidor.closeIdleConnections();
    setTimeout(() => {
      console.error(`Encerramento passou de ${PRAZO_DE_ENCERRAMENTO_MS}ms; saindo a forca.`);
      process.exit(1);
    }, PRAZO_DE_ENCERRAMENTO_MS).unref();

    servidor.close(async () => {
      await bancoDeDados.destroy();
      process.exit(0);
    });
  };

  process.on('SIGTERM', encerrar('SIGTERM'));
  process.on('SIGINT', encerrar('SIGINT'));
}

iniciar();
