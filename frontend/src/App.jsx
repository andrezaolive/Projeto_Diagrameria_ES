import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AutenticacaoProvider, useAutenticacao } from './contextos/Autenticacao';
import { ConfigProvider } from './contextos/ConfigContexto';
import { JogoProvider } from './contextos/JogoContexto';
import Ambiente from './componentes/Ambiente';
import ModalConfig from './componentes/ModalConfig';
import Login from './paginas/Login';
import Balcao from './paginas/Balcao';
import MesaTrabalho from './paginas/MesaTrabalho';

function RotaPrivada({ children }) {
  const { logado } = useAutenticacao();
  return logado ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AutenticacaoProvider>
        <ConfigProvider>
          <JogoProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/balcao"
                element={
                  <RotaPrivada>
                    <Balcao />
                  </RotaPrivada>
                }
              />
              <Route
                path="/mesa/:pedidoId"
                element={
                  <RotaPrivada>
                    <MesaTrabalho />
                  </RotaPrivada>
                }
              />
              <Route path="*" element={<Navigate to="/balcao" replace />} />
            </Routes>

            {/* Camadas globais: efeitos de tela e janela de configurações */}
            <Ambiente />
            <ModalConfig />
          </JogoProvider>
        </ConfigProvider>
      </AutenticacaoProvider>
    </BrowserRouter>
  );
}
