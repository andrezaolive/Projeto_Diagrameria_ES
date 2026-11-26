/**
 * Regras de coerencia interna do diagrama que o JSON Schema nao consegue
 * expressar: ids de classe unicos e relacionamentos apontando para classes que
 * existem no mesmo diagrama.
 *
 * Isto e validacao de ENTRADA, nao correcao: um diagrama com id solto e uma
 * requisicao malformada (bug do Canvas ou gabarito gravado errado), e nao um
 * erro de UML do jogador. Por isso roda antes do ValidadorUML e fica separado
 * dele — o validador pode assumir que recebe um diagrama coerente.
 *
 * Pressupoe que o diagrama ja passou no schema.
 */

/**
 * @param {object} diagrama  Diagrama que ja passou no schema.
 * @returns {{campo: string, mensagem: string}[]}  Vazio quando esta coerente.
 */
function verificarIntegridade(diagrama) {
  const problemas = [];

  const idsDeClasse = new Set();
  diagrama.classes.forEach((classe, i) => {
    if (idsDeClasse.has(classe.id)) {
      problemas.push({
        campo: `classes/${i}/id`,
        mensagem: `id "${classe.id}" repetido: cada classe precisa de um id unico`,
      });
    }
    idsDeClasse.add(classe.id);
  });

  const idsDeRelacionamento = new Set();
  diagrama.relacionamentos.forEach((relacionamento, i) => {
    // O id do relacionamento e opcional; so e checado quando vem.
    if (relacionamento.id !== undefined) {
      if (idsDeRelacionamento.has(relacionamento.id)) {
        problemas.push({
          campo: `relacionamentos/${i}/id`,
          mensagem: `id "${relacionamento.id}" repetido: cada relacionamento precisa de um id unico`,
        });
      }
      idsDeRelacionamento.add(relacionamento.id);
    }

    for (const ponta of ['origem', 'destino']) {
      if (!idsDeClasse.has(relacionamento[ponta])) {
        problemas.push({
          campo: `relacionamentos/${i}/${ponta}`,
          mensagem: `aponta para a classe "${relacionamento[ponta]}", que nao existe no diagrama`,
        });
      }
    }
  });

  return problemas;
}

module.exports = { verificarIntegridade };
