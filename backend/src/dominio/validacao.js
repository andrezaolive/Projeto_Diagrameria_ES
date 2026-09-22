const { Buffer } = require('buffer');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const localizar = require('ajv-i18n/localize/pt-BR');

/**
 * Instancia unica do Ajv do projeto, e a traducao do erro dele.
 *
 * O mesmo Ajv valida o corpo das rotas e o diagrama UML: uma unica gramatica de
 * erro no projeto inteiro, e o frontend recebe sempre o mesmo formato de
 * `detalhes` — { campo, mensagem }, com a mensagem em portugues.
 *
 * `coerceTypes` fica desligado de proposito — "1" nao deve virar 1 sem alguem
 * ter pedido. `removeAdditional` tambem: campo desconhecido e erro, nao lixo
 * para ignorar em silencio.
 */

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

/**
 * Palavras-chave proprias. As mensagens ja nascem em portugues, e ficam fora do
 * ajv-i18n: ele troca a mensagem de keyword que nao conhece por um texto
 * generico ("deve passar a validacao da keyword ...").
 */
const PALAVRAS_PROPRIAS = new Set();

function adicionarPalavra(definicao, mensagem) {
  PALAVRAS_PROPRIAS.add(definicao.keyword);
  ajv.addKeyword({
    ...definicao,
    errors: true,
    validate: function validar(parametro, dado) {
      if (definicao.passa(parametro, dado)) return true;
      validar.errors = [{ keyword: definicao.keyword, message: mensagem(parametro), params: {} }];
      return false;
    },
  });
}

// O bcrypt so le os primeiros 72 BYTES da senha e ignora o resto em silencio.
// maxLength conta caracteres: 72 letras acentuadas ou emoji passam dos 72 bytes,
// e duas senhas diferentes no fim virariam a mesma.
adicionarPalavra(
  {
    keyword: 'maxBytes',
    type: 'string',
    schemaType: 'number',
    passa: (limite, dado) => Buffer.byteLength(dado, 'utf8') <= limite,
  },
  (limite) => `deve ter no maximo ${limite} bytes (acentos e emoji contam mais de um)`
);

// Para texto que o jogador ve (nome). Recusa em vez de aparar: aparar depois de
// validar deixaria "  a" passar no minLength e ser gravado como "a".
adicionarPalavra(
  {
    keyword: 'semEspacosNasPontas',
    type: 'string',
    schemaType: 'boolean',
    passa: (ativo, dado) => !ativo || dado === dado.trim(),
  },
  () => 'nao pode comecar nem terminar com espaco'
);

/**
 * Traduz o erro cru do Ajv para algo que cabe numa mensagem de tela.
 *
 * @param {object[]} errosDoAjv  `validar.errors` de uma funcao compilada.
 * @returns {{campo: string, mensagem: string}[]}
 */
function paraDetalhes(errosDoAjv) {
  // localizar() altera os objetos no lugar; copia para nao mexer no estado da
  // funcao compilada, que o Ajv reaproveita.
  const erros = errosDoAjv.map((erro) => ({ ...erro }));
  localizar(erros.filter((erro) => !PALAVRAS_PROPRIAS.has(erro.keyword)));

  return erros.map((erro) => ({
    campo: campoDoErro(erro),
    mensagem: erro.message,
  }));
}

/**
 * instancePath aponta para o objeto que falhou ("/classes/0"; a raiz vem
 * vazia). Em campo faltando ou sobrando, o nome do campo vem em params — junta
 * os dois para o frontend saber exatamente qual campo marcar.
 */
function campoDoErro(erro) {
  const caminho = erro.instancePath.replace(/^\//, '');
  const propriedade = erro.params?.missingProperty ?? erro.params?.additionalProperty;
  return [caminho, propriedade].filter(Boolean).join('/') || '(corpo)';
}

module.exports = { ajv, paraDetalhes };
