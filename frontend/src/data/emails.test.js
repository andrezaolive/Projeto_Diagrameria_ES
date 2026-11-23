import { describe, expect, it } from 'vitest';
import { MODELOS, partesDoModelo, JUMBOS } from './pedidos.js';

// Todo e-mail de pedido (normal e JUMBO) cita entre aspas o que o jogador precisa escrever: nomes
// dos elementos e do sistema, eventos das transições e os atributos/métodos das classes
const NOMEADOS = ['sistema', 'ator', 'casoDeUso', 'classe', 'estado', 'decisao'];
describe('e-mails dos pedidos', () => {
  it('citam todos os nomes, eventos, atributos e métodos entre aspas', () => {
    for (const m of [...MODELOS, ...JUMBOS]) {
      const texto = m.corpo.join(' ');
      for (const { esperado } of partesDoModelo(m)) {
        for (const n of esperado.nodes) if (NOMEADOS.includes(n.tipo)) expect(texto, `${m.id}: ${n.rotulo}`).toContain(`"${n.rotulo}"`);
        for (const e of esperado.edges) if (e.rotulo) expect(texto, `${m.id}: ${e.rotulo}`).toContain(`"${e.rotulo}"`);
        for (const n of esperado.nodes) for (const mb of [...(n.atributos ?? []), ...(n.metodos ?? [])]) expect(texto, `${m.id}: ${mb}`).toContain(`"${mb}"`);
      }
    }
  });
});
