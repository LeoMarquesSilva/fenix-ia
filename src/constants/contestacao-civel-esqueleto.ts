/**
 * Esqueleto estrutural para CONTESTAÇÃO na esfera cível.
 * Usado como referência nos prompts de `peticao-ai` quando o tipo de peça é Contestação.
 */
export const CONTESTACAO_CIVEL_ESQUELETO_MARKDOWN = `
## 1. Endereçamento e Qualificação

1. **Endereçamento ao juízo competente**
   - "Excelentíssimo Senhor Doutor Juiz de Direito da _ Vara da Comarca de _".
2. **Referência ao processo e às partes**
   - Número dos autos.
   - Qualificação sintética da parte ré (nome/razão social, tipo de pessoa, CNPJ/CPF, endereço).
   - Indicação da ação proposta e da parte autora.
3. **Ato de apresentação da contestação**
   - Fórmula padrão: vem, respeitosamente, à presença de Vossa Excelência, por seus advogados, apresentar CONTESTAÇÃO, com fundamento no art. 5º, LV, CF e arts. 335 e seguintes do CPC.

## 2. Tópico de Tempestividade (quando pertinente)

1. **Base legal do prazo** — Indicar prazo aplicável (ex.: 15 dias, art. 335, CPC) e forma de contagem (arts. 219, 224 e 231, CPC).
2. **Marco inicial da contagem** — Data da citação/juntada do AR ou certidão, com referência ao evento/processo.
3. **Suspensões ou interrupções de prazo** — Feriados, atos normativos locais, suspensões de prazo, se houver.
4. **Conclusão de tempestividade** — Frase padrão: "Desta forma, a apresentação da presente contestação é tempestiva, motivo pelo qual requer-se o seu regular recebimento."

## 3. Breve Síntese da Demanda

1. **Identificação da ação e pedido da autora** — Tipo de ação; bem da vida pretendido.
2. **Fundamentos alegados na inicial** — Fatos principais narrados pela autora; documentos mencionados.
3. **Conclusão sintética da tese da autora** — Uma frase: "Em síntese, a autora pretende o reconhecimento de … e a condenação da ré a …".

## 4. Exposição da Versão dos Fatos

1. **Correção/Completação da narrativa da inicial** — Narrativa parcial/incompleta; realidade dos fatos, ponto a ponto.
2. **Reconhecimentos e divergências** — O que a ré admite; o que contesta.
3. **Relações jurídicas conexas / obrigações recíprocas** — Outros ajustes; interdependência entre créditos e débitos.
4. **Fundamentação fática para compensação, inexigibilidade, etc.** — Fatos que sustentam teses jurídicas (compensação, novação, recuperação, prescrição, etc.).

## 5. Preliminares (quando houver)

Título próprio: "IV. PRELIMINARMENTE" e subitens para cada preliminar relevante.

1. **Exemplos** — Falta de interesse de agir; inépcia da inicial; ilegitimidade de parte; incompetência absoluta/relativa; prescrição/decadência quando tratadas como preliminares.
2. **Estrutura interna de cada preliminar** — Título; fundamento conceitual; aplicação ao caso; pedido específico (extinção sem resolução do mérito, com artigo do CPC, ex.: art. 485, VI).
3. **Fecho** — Acolhimento das preliminares e extinção sem julgamento do mérito.

## 6. Mérito (Impugnação aos Pedidos)

Seção "V. DO MÉRITO", subdividida em teses.

1. **Tese principal de mérito** — Ex.: inexigibilidade do crédito nos moldes pretendidos; regime especial; nulidade de cláusulas; inexistência de dano.
2. **Subteses em alíneas** — A. Inexigibilidade / regime jurídico específico; B. Compensação de créditos (art. 368 CC e princípios); demais (dano, excesso, culpa, juros/multa abusivos).
3. **Normas e precedentes** — Artigos pertinentes; jurisprudência em blocos sintéticos quando útil.
4. **Conclusão do mérito** — Improcedência total ou parcial.

## 7. Ônus da Prova (Distribuição/Inversão)

Título: "VI. DA DISTRIBUIÇÃO DO ÔNUS DA PROVA" (ou similar).

1. **Fundamento legal** — Art. 373, CPC; art. 357, III, CPC (distribuição dinâmica), quando aplicável.
2. **Tese** — Ônus da autora quanto aos fatos constitutivos; ou pedido de redistribuição dinâmica.
3. **Pedido** — Definição na decisão de saneamento.

## 8. Pedidos Finais (Dispositivo)

Seção "VII. DOS PEDIDOS" com pedidos claros em alíneas.

1. **Processuais (preliminares)** — Ex.: acolhimento de preliminar; extinção sem resolução do mérito.
2. **Subsidiários de mérito** — Inexigibilidade; compensação com redução/extinção do valor.
3. **Acessórios** — Custas e honorários (art. 85, CPC); produção de provas admitidas.
4. **Fecho formal** — Local, data, nome e OAB.

## 9. Padrões gerais para a redação

1. **Organização** — Títulos claros e numerados (I. Tempestividade; II. Breve síntese; III. Dos fatos; IV. Preliminares; V. Mérito; VI. Ônus da prova; VII. Dos pedidos), ajustando à estratégia do caso.
2. **Estilo** — Técnico, formal, objetivo, 3ª pessoa; parágrafos curtos; transições ("Inicialmente", "Todavia", "Ademais", "Dessa forma").
3. **Fato e direito** — Descrever o fato; em seguida encaixar dispositivo legal e, quando útil, jurisprudência; evitar artigos soltos sem vínculo ao caso.
4. **Camadas estratégicas** — Preliminares; mérito; pedidos subsidiários e cenários alternativos.
5. **Metodologia** — Identificar tipo de ação e pedidos; mapear preliminares; construir versão fática da ré; selecionar teses; fechar pedidos delimitados.
`.trim()

/** Tipos de peça nos quais o esqueleto cível de contestação se aplica. */
export function isContestacaoCivelTipo(tipoPeticao: string): boolean {
  const t = tipoPeticao.trim().toLowerCase()
  return t === 'contestação' || t === 'contestacao'
}
