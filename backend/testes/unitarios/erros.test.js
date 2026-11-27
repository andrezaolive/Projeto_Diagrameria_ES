const {
  ErroDaAplicacao,
  ErroDeValidacao,
  ErroDeAutenticacao,
  ErroDeConflito,
  ErroNaoEncontrado,
  ErroDeLimite,
} = require('../../src/dominio/erros');

describe('erros de dominio', () => {
  it('cada classe tem codigo e mensagem padrao estaveis', () => {
    expect(new ErroDeAutenticacao()).toMatchObject({
      codigo: 'NAO_AUTENTICADO',
      message: 'Credenciais invalidas.',
    });
    expect(new ErroDeConflito('Ja existe.')).toMatchObject({ codigo: 'CONFLITO' });
    expect(new ErroNaoEncontrado()).toMatchObject({
      codigo: 'NAO_ENCONTRADO',
      message: 'Recurso nao encontrado.',
    });
    expect(new ErroDeLimite()).toMatchObject({ codigo: 'MUITAS_TENTATIVAS' });
  });

  it('aceita codigo e mensagem proprios', () => {
    expect(new ErroDeConflito('Email em uso.', 'EMAIL_EM_USO')).toMatchObject({
      codigo: 'EMAIL_EM_USO',
      message: 'Email em uso.',
    });
    expect(new ErroNaoEncontrado('Sem save.', 'SEM_PROGRESSO').codigo).toBe('SEM_PROGRESSO');
    expect(new ErroDeAutenticacao('Token expirado.').message).toBe('Token expirado.');
    expect(new ErroDeLimite('Calma.').message).toBe('Calma.');
  });

  it('so carrega detalhes quando eles existem', () => {
    const comDetalhes = new ErroDeValidacao('Invalido.', [{ campo: 'email', mensagem: 'x' }]);
    expect(comDetalhes.detalhes).toEqual([{ campo: 'email', mensagem: 'x' }]);
    expect('detalhes' in new ErroDeValidacao('Invalido.')).toBe(false);
  });

  it('herda de Error com o nome da subclasse', () => {
    const erro = new ErroDeLimite();
    expect(erro).toBeInstanceOf(ErroDaAplicacao);
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe('ErroDeLimite');
  });
});
