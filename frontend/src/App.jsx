import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AutenticacaoProvider, useAutenticacao } from './contextos/Autenticacao';
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
      </AutenticacaoProvider>
    </BrowserRouter>
  );
}