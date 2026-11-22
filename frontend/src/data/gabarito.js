// Helpers para escrever os gabaritos dos pedidos (data/pedidos.js e data/complexos.js).

// w/h: só no sistema (fronteira), que tem tamanho próprio
export const n = (id, tipo, rotulo, x, y, w, h) => ({ id, tipo, rotulo, x, y, ...(w ? { w, h } : {}) });
// multDe / multPara: multiplicidade em cada ponta (só associação, agregação e composição; ver lib/multiplicidade.js)
export const e = (tipo, de, para, multDe, multPara) => ({
  id: `${de}-${tipo}-${para}`,
  tipo,
  de,
  para,
  ...(multDe ? { multDe } : {}),
  ...(multPara ? { multPara } : {}),
});
// Classe com atributos e métodos (uma linha UML por membro: "- saldo: float", "+ sacar(valor: float): bool")
export const c = (id, rotulo, x, y, atributos = [], metodos = []) => ({ id, tipo: 'classe', rotulo, x, y, atributos, metodos });
// Transição do diagrama de estados: `evento` vai no rótulo da seta (vazio saindo do início e chegando ao fim)
export const t = (de, para, evento = '') => ({ id: `${de}-transicao-${para}`, tipo: 'transicao', de, para, rotulo: evento });

