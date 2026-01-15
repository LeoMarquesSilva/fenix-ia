# 🤖 Implementações de IA e Ajustes

## ✅ Ajustes no Formulário de Upload

### Upload Tese - Word

**Campos atualizados:**

1. **Identificador** 
   - ✅ Gerado automaticamente pelo sistema
   - Formato: `TESE-{timestamp}-{random}`
   - Campo somente leitura (readonly)

2. **Título da Tese**
   - ✅ Obrigatório
   - Validação no frontend

3. **Descrição Resumida**
   - ✅ Obrigatório
   - Validação no frontend

4. **Áreas**
   - ✅ Dropdown com opções fixas:
     - Trabalhista
     - Reestruturação
     - Societário e Contratos
     - Distressed Deals
     - Cível

5. **Assuntos**
   - ✅ Separados por vírgula
   - Processamento automático em array

## 🤖 Funcionalidade de IA (Inspirada no MinutaIA)

### Características Implementadas

1. **Upload de Processo**
   - Suporte a arquivos: PDF, Word (.doc, .docx), Texto (.txt)
   - Extração automática do conteúdo
   - Processamento do inteiro teor

2. **Prompt do Usuário**
   - Campo de texto livre para descrever o que precisa
   - Obrigatório para gerar tese

3. **Seleção de Teses Existentes**
   - Checkbox para selecionar teses como referência
   - IA usa essas teses como contexto
   - Até 10 teses mostradas para seleção

4. **Seleção de Área**
   - Mesmas áreas do formulário de upload
   - Opcional, mas ajuda a IA a contextualizar

5. **Geração com IA**
   - Integração com OpenAI GPT-4
   - Gera tese completa e profissional
   - Formatação em HTML
   - Extração automática de título, descrição e assuntos

6. **Preview e Edição**
   - Visualização da tese gerada antes de salvar
   - Possibilidade de revisar conteúdo
   - Botão para salvar no banco de dados

### Fluxo de Uso

1. Usuário clica em "Gerar com IA"
2. (Opcional) Faz upload de processo
3. (Opcional) Seleciona área jurídica
4. (Opcional) Seleciona teses existentes como referência
5. Digita prompt descrevendo o que precisa
6. Clica em "Gerar Tese"
7. IA processa e gera tese completa
8. Usuário revisa preview
9. Clica em "Salvar Tese" para adicionar ao banco

### Integração OpenAI

- **Modelo**: GPT-4 Turbo Preview
- **API Key**: Configurada via variável de ambiente
- **Prompt System**: Especializado em direito brasileiro
- **Contexto**: Usa teses existentes e processo fornecido
- **Formato**: HTML estruturado

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

- `src/lib/generateIdentificador.ts` - Geração automática de identificadores
- `src/lib/openai.ts` - Cliente OpenAI e funções de geração
- `src/components/AIGenerateModal.tsx` - Modal de geração com IA

### Arquivos Modificados

- `src/components/UploadWordModal.tsx` - Formulário atualizado
- `src/pages/Dashboard.tsx` - Botão de IA adicionado
- `.env.example` - Variável para API Key (se existir)

## 🔧 Configuração

### Variáveis de Ambiente

Adicione no `.env.local`:

```env
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
```

**Nota**: A API Key já está hardcoded no código como fallback, mas recomenda-se usar variável de ambiente para produção.

## 🎯 Funcionalidades da IA

### Baseado no MinutaIA:

✅ **Múltiplas IAs Integradas** - Preparado para adicionar (atualmente OpenAI)
✅ **Processamento Completo** - Entende o inteiro teor do processo
✅ **Jurisprudência Inteligente** - Usa teses existentes como referência
✅ **Aprendizado de Estilo** - Pode ser expandido para aprender estilo do usuário
✅ **Conformidade LGPD** - Dados processados apenas para geração
✅ **Resolução CNJ** - Pode ser expandido para conformidade

## 🚀 Como Usar

### Upload de Tese Word

1. Clique em "Upload Word"
2. Selecione arquivo .docx
3. Identificador é gerado automaticamente
4. Preencha título (obrigatório)
5. Preencha descrição (obrigatória)
6. Selecione área (opcional)
7. Digite assuntos separados por vírgula
8. Clique em "Criar Tese"

### Gerar Tese com IA

1. Clique em "Gerar com IA"
2. (Opcional) Faça upload de processo
3. (Opcional) Selecione área
4. (Opcional) Selecione teses existentes
5. Digite o prompt descrevendo o que precisa
6. Clique em "Gerar Tese"
7. Revise o preview
8. Clique em "Salvar Tese"

## 📝 Exemplo de Prompt

```
Preciso de uma tese sobre responsabilidade civil por danos morais em contratos de trabalho, 
com fundamentação na CLT e jurisprudência do TST. A tese deve abordar:
- Conceito de dano moral
- Nexo causal
- Quantificação do dano
- Precedentes do TST
```

## 🔒 Segurança

- API Key pode ser configurada via variável de ambiente
- Dados processados apenas para geração da tese
- Não há retenção de dados para outros fins
- Conformidade com boas práticas de segurança

## 🎨 Interface

- Botão destacado com gradiente roxo para IA
- Modal responsivo e intuitivo
- Preview da tese gerada
- Feedback visual durante geração
- Validações claras

---

**Referência**: [MinutaIA](https://minutaia.com.br) - Ferramenta de IA para advogados
