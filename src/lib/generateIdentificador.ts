// Função para gerar identificador automático único
export async function generateIdentificador(): Promise<string> {
  // Gerar baseado em timestamp + random para garantir unicidade
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TESE-${timestamp}-${random}`
}

// Função alternativa: gerar baseado em sequencial do banco
export async function generateSequentialIdentificador(
  getLastNumber: () => Promise<number>
): Promise<string> {
  const lastNumber = await getLastNumber()
  const nextNumber = lastNumber + 1
  return `TESE-${String(nextNumber).padStart(6, '0')}`
}
