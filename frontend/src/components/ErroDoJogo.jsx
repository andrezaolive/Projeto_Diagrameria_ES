import { Component } from 'react';

// Rastro das últimas ações despachadas (GameContext): ajuda a descobrir o que levou a um erro
const RASTRO = [];
const MAX_RASTRO = 25;
export function registrarAcao(action) {
  RASTRO.push(`${new Date().toLocaleTimeString()} ${action?.type}${action?.id ? ` ${action.id}` : ''}`);
  if (RASTRO.length > MAX_RASTRO) RASTRO.shift();
}

export const CHAVE_ERRO = 'diagrameria-ultimo-erro';

// Pega qualquer erro de renderização (ou do reducer) e mostra o que aconteceu, no lugar da tela
// vazia. O save fica como estava: recarregar volta para o menu com o progresso.
export default class ErroDoJogo extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null, detalhes: '', copiado: false };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    const detalhes = [
      `Erro: ${erro?.message ?? erro}`,
      `Quando: ${new Date().toLocaleString()}`,
      '',
      'Pilha:',
      ...(erro?.stack ?? '').split('\n').slice(0, 8),
      '',
      'Componentes:',
      ...(info?.componentStack ?? '').trim().split('\n').slice(0, 10).map((l) => l.trim()),
      '',
      'Últimas ações:',
      ...RASTRO.slice(-15),
    ].join('\n');
    console.error('[Diagrameria] o jogo travou\n' + detalhes);
    try {
      localStorage.setItem(CHAVE_ERRO, detalhes);
    } catch {
      /* sem storage */
    }
    this.setState({ detalhes });
  }

  copiar = () => {
    navigator.clipboard?.writeText(this.state.detalhes).then(() => this.setState({ copiado: true }), () => {});
  };

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="erro-do-jogo" role="alert">
        <div className="erro-caixa">
          <strong>OPS! O JOGO TRAVOU</strong>
          <p>Algo deu errado. Seu progresso salvo continua lá: recarregue para voltar ao menu.</p>
          <p>Se puder, copie os detalhes e mande para a equipe.</p>
          <pre className="rolagem">{this.state.detalhes || String(this.state.erro?.message ?? this.state.erro)}</pre>
          <div className="erro-botoes">
            <button className="px-btn claro" onClick={this.copiar}>{this.state.copiado ? 'Copiado!' : 'Copiar detalhes'}</button>
            <button className="px-btn rosa" onClick={() => window.location.reload()}>Recarregar o jogo</button>
          </div>
        </div>
      </div>
    );
  }
}
