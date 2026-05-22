import { Navigate } from 'react-router-dom'

/** Mantém uma rota dedicada; métricas ficam no Dashboard. */
export default function Relatorios() {
  return <Navigate to="/dashboard?tab=metrics" replace />
}
