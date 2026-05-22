# IA para Teses Jurídicas — Fênix I.A

## Modelo atual

**gpt-4o** (OpenAI)

- Modelo mais recente e capaz da OpenAI
- 128k tokens de contexto
- Bom desempenho em raciocínio jurídico e texto estruturado
- Suporta texto e imagem

## Configuração

O modelo é definido em `src/lib/ai-config.ts`. Para alterar:

```ts
export const AI_MODEL = 'gpt-4o'
```

Alternativas:
- `gpt-4o-mini` — mais rápido e barato, bom para tarefas simples
- `gpt-4-turbo` — legado, ainda disponível
- `gpt-4` — modelo anterior de alta capacidade

## Estratégia para uma LLM forte em teses jurídicas

### 1. System prompt especializado
Já implementado: o assistente usa um prompt que o posiciona como especialista em direito brasileiro, com instruções para:
- Usar linguagem jurídica adequada
- Citar fundamentos legais
- Diferenciar respostas aplicáveis (HTML) de informativas (texto)

### 2. RAG (Retrieval-Augmented Generation)
- **Documentos**: petições, contratos e textos de referência anexados pelo usuário
- **Modelos**: teses modelo para imitar estilo e formatação
- **Pesquisa web**: Wikipedia + links para Google/Bing
- **Jurisprudência**: links para Jusbrasil e LexML

### 3. Fine-tuning (futuro)
Para uma LLM mais forte em teses:
- Corpus de decisões do STF, STJ e tribunais
- Doutrina jurídica brasileira
- Teses vencedoras e petições de referência

### 4. Chain-of-thought
Para fundamentação complexa, instruir o modelo a:
- Expor o raciocínio passo a passo
- Citar artigo, inciso e parágrafo
- Distinguir tese, fundamentação e conclusão

### 5. Integrações futuras
- API de jurisprudência (Jusbrasil, LexML, etc.)
- Base de legislação atualizada
- Verificação de citações e referências
