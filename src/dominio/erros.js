/**
 * Erros de negocio.
 *
 * Servico e repositorio lancam estes erros; o middleware tratadorDeErros e o
 * unico lugar que os transforma em resposta — e o unico que sabe qual status
 * HTTP cada um vira. O dominio fala "conflito", "nao encontrado"; quem traduz
 * isso para 409 e 404 e a camada HTTP. Assim a regra de negocio pode ser
 * reusada fora do Express (um job, um script) sem carregar protocolo junto.
 */

class ErroDaAplicacao extends Error {
  /**
   * @param {string} codigo  Identificador estavel para o frontend ramificar (nao muda com o texto).
   * @param {string} mensagem  Texto em portugues, exibivel para o jogador.
   * @param {object} [detalhes]  Informacao extra opcional (ex: lista de campos invalidos).
   */
  constructor(codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = new.target.name;
    this.codigo = codigo;
    if (detalhes !== undefined) this.detalhes = detalhes;
    Error.captureStackTrace?.(this, new.target);
  }
}

class ErroDeValidacao extends ErroDaAplicacao {
  constructor(mensagem, detalhes) {
    super('ENTRADA_INVALIDA', mensagem, detalhes);
  }
}

class ErroDeAutenticacao extends ErroDaAplicacao {
  constructor(mensagem = 'Credenciais invalidas.') {
    super('NAO_AUTENTICADO', mensagem);
  }
}

class ErroDeConflito extends ErroDaAplicacao {
  constructor(mensagem, codigo = 'CONFLITO') {
    super(codigo, mensagem);
  }
}

class ErroNaoEncontrado extends ErroDaAplicacao {
  constructor(mensagem = 'Recurso nao encontrado.') {
    super('NAO_ENCONTRADO', mensagem);
  }
}

class ErroDeLimite extends ErroDaAplicacao {
  constructor(mensagem = 'Muitas tentativas. Espere um pouco e tente de novo.') {
    super('MUITAS_TENTATIVAS', mensagem);
  }
}

module.exports = {
  ErroDaAplicacao,
  ErroDeValidacao,
  ErroDeAutenticacao,
  ErroDeConflito,
  ErroNaoEncontrado,
  ErroDeLimite,
};
