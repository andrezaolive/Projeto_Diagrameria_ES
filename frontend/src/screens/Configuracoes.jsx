import { useEffect, useRef, useState } from 'react';
import { setVolumeMusica } from '../lib/musica.js';
import { Botao, Slider, usePreviaVhs } from '../components/ui.jsx';
import { useGame } from '../state/GameContext.jsx';
import { NIVEIS_INTERFACE } from '../state/reducer.js';

const ROTULOS_INTERFACE = ['Reduzido', 'Auto', 'Grande'];

// Usado no menu (Configurações) e na tela de pausa
export default function Configuracoes({ onFechar, rodape, onResetar }) {
  const { state, dispatch } = useGame();
  const [cfg, setCfg] = useState(state.config);
  const mudar = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }));
  const aplicar = () => dispatch({ type: 'CONFIG', config: cfg });
  const nivel = Math.max(0, NIVEIS_INTERFACE.indexOf(cfg.interface));

  // o filtro VHS aparece ao vivo enquanto a janela está aberta; ao fechar sem aplicar, volta ao salvo
  const setPrevia = usePreviaVhs();
  useEffect(() => setPrevia({ ativo: cfg.vhsAtivo, intensidade: cfg.vhsIntensidade }), [cfg.vhsAtivo, cfg.vhsIntensidade, setPrevia]);
  useEffect(() => () => setPrevia(null), [setPrevia]);

  // volume da música também muda ao vivo; ao fechar, vale o salvo
  const salvo = useRef(state.config.musica);
  salvo.current = state.config.musica;
  useEffect(() => setVolumeMusica(cfg.musica / 100), [cfg.musica]);
  useEffect(() => () => setVolumeMusica(salvo.current / 100), []);

  return (
    <div className="config">
      <Slider rotulo="Música" valor={cfg.musica} onChange={mudar('musica')} />
      <Slider rotulo="Efeitos" valor={cfg.efeitos} onChange={mudar('efeitos')} />
      <Slider
        rotulo="Interface"
        valor={nivel}
        min={0}
        max={2}
        passo={1}
        texto={ROTULOS_INTERFACE[nivel]}
        marcas={ROTULOS_INTERFACE}
        onChange={(i) => mudar('interface')(NIVEIS_INTERFACE[i])}
      />
      <div className="px-linha">
        <span className="rotulo">Filtro VHS</span>
        <span className="descricao">fita antiga: linhas, chuvisco e tremidas</span>
        <Botao
          tamanho="pequeno"
          variante={cfg.vhsAtivo ? 'ativo' : 'claro'}
          aria-pressed={cfg.vhsAtivo}
          onClick={() => mudar('vhsAtivo')(!cfg.vhsAtivo)}
        >
          {cfg.vhsAtivo ? 'Ligado' : 'Desligado'}
        </Botao>
      </div>
      <Slider
        rotulo="Intensidade"
        valor={cfg.vhsIntensidade}
        min={10}
        passo={10}
        desativado={!cfg.vhsAtivo}
        onChange={mudar('vhsIntensidade')}
      />
      {onResetar && (
        <div className="px-linha">
          <span className="rotulo">Dados</span>
          <span className="descricao">apaga nome, progresso e compras deste navegador</span>
          <Botao variante="rosa" tamanho="pequeno" onClick={onResetar}>Resetar dados</Botao>
        </div>
      )}
      <div className="rodape">
        {rodape ? (
          rodape(aplicar)
        ) : (
          <>
            <Botao variante="claro" som="voltar" onClick={onFechar}>Voltar</Botao>
            <Botao variante="claro" onClick={() => setCfg(state.config)}>Cancelar</Botao>
            <Botao variante="menta" onClick={() => { aplicar(); onFechar(); }}>Aplicar</Botao>
          </>
        )}
      </div>
    </div>
  );
}
