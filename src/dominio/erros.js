/**
 * Erros de negocio com status HTTP embutido.
 *
 * Servico e repositorio lancam estes erros; o middleware tratadorDeErros e o
 * unico lugar que os transforma em resposta. Assim a camada de negocio nunca
 * precisa receber o `res` do Express so para poder falhar.
 */

class ErroDaAplicacao extends Error {
  /**
   * @param {number} status  Codigo HTTP.
   * @param {string} codigo  Identificador estavel para o frontend ramificar (nao muda com o texto).
   * @param {string} mensagem  Texto em portugues, exibivel para o jogador.
   * @param {object} [detalhes]  Informacao extra opcional (ex: lista de campos invalidos).
   */
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = new.target.name;
    this.status = status;
    this.codigo = codigo;
    if (detalhes !== undefined) this.detalhes = detalhes;
    Error.captureStackTrace?.(this, new.target);
  }
}

class ErroDeValidacao extends ErroDaAplicacao {
  constructor(mensagem, detalhes) {
    super(400, 'ENTRADA_INVALIDA', mensagem, detalhes);
  }
}

class ErroDeAutenticacao extends ErroDaAplicacao {
  constructor(mensagem = 'Credenciais invalidas.') {
    super(401, 'NAO_AUTENTICADO', mensagem);
  }
}

class ErroDeConflito extends ErroDaAplicacao {
  constructor(mensagem, codigo = 'CONFLITO') {
    super(409, codigo, mensagem);
  }
}

class ErroNaoEncontrado extends ErroDaAplicacao {
  constructor(mensagem = 'Recurso nao encontrado.') {
    super(404, 'NAO_ENCONTRADO', mensagem);
  }
}

module.exports = {
  ErroDaAplicacao,
  ErroDeValidacao,
  ErroDeAutenticacao,
  ErroDeConflito,
  ErroNaoEncontrado,
};
