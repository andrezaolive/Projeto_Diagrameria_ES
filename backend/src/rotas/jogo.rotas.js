const { Router } = require('express');
const controlador = require('../controladores/jogo.controlador');
const { validaCorpo } = require('../middlewares/validaEntrada');
const { exigeAutenticacao } = require('../middlewares/autenticacao');
const { limitaTentativas } = require('../middlewares/limitaTentativas');
const ambiente = require('../config/ambiente');

/**
 * Rotas do jogo: progresso, dia de trabalho e pedidos. Todas exigem login.
 *
 * `exigeAutenticacao` vai em cada rota, e nao num `rotas.use()`: este router
 * e montado na raiz de /api, e um use() global responderia 401 ate para rota
 * que nao existe, no lugar do 404.
 */

// O corpo so precisa ser um objeto com `diagrama`. O formato do diagrama e
// validado pelo servico, com o schema proprio (docs/schemas/) e a integridade
// dos ids — o mesmo portao por onde passa todo diagrama do sistema.
const schemaEntrega = {
  type: 'object',
  required: ['diagrama'],
  additionalProperties: false,
  properties: {
    diagrama: { type: 'object' },
  },
};

// Contra script mandando entrega em loop. Um jogador de verdade entrega um
// pedido a cada minuto ou dois; 30 por minuto so e atingido por automacao.
const limiteDeEntregas = limitaTentativas({
  limite: 30,
  janelaMs: 60 * 1000,
  porUsuario: true,
  ativo: !ambiente.ehTeste,
});

const rotas = Router();
const logado = exigeAutenticacao;

rotas.get('/progresso', logado, controlador.progresso);

rotas.post('/dias', logado, controlador.iniciarDia);
// Antes de /dias/:id, senao "atual" seria lido como id.
rotas.get('/dias/atual', logado, controlador.diaAtual);
rotas.get('/dias/:id', logado, controlador.consultarDia);
rotas.post('/dias/:id/pausar', logado, controlador.pausar);
rotas.post('/dias/:id/retomar', logado, controlador.retomar);

rotas.post('/pedidos/:id/aceitar', logado, controlador.aceitarPedido);
rotas.post(
  '/pedidos/:id/entrega',
  logado,
  limiteDeEntregas,
  validaCorpo(schemaEntrega),
  controlador.entregarPedido
);

module.exports = rotas;
