# League of Legends Annual Ranking System

Sistema de ranking anual para League of Legends, focado em consistência e performance relativa. O sistema calcula um **MatchScore (0-100)** para cada partida, comparando o desempenho do jogador com a média da sua lane naquela partida específica.

## 📋 Funcionalidades Principais

-   **MatchScore Engine**: Algoritmo determinístico que avalia Resultado, Performance (vs Lane), Objetivos e Disciplina.
-   **Contexto Relativo**: Nenhuma métrica é absoluta. O sistema compara seu Farm/Dano/Visão contra o oponente de lane.
-   **Auditoria**: Armazena as médias da lane junto com o score para permitir verificação futura.
-   **CLI de Teste**: Ferramenta para calcular e validar o score de qualquer partida em tempo real.
-   **Filtros Rígidos**: Ignora remakes (<10min) e partidas fora da Season.

## 🚀 Configuração com Docker (Recomendado)

O projeto está totalmente containerizado para facilitar o deploy e execução.

1.  **Pré-requisitos**: Docker e Docker Compose instalados.
2.  **Configuração**:
    Crie um arquivo `.env` na raiz (baseado no `.env.example`) com sua `RIOT_API_KEY`.
    
    ```env
    POSTGRES_USER=admin
    POSTGRES_PASSWORD=admin
    POSTGRES_DB=ranking_lol
    DATABASE_URL="postgresql://admin:admin@postgres:5432/ranking_lol?schema=public"
    RIOT_API_KEY="RGAPI-..."
    ```

3.  **Executar**:
    ```bash
    docker-compose up --build -d
    ```
    Isso iniciará:
    *   **PostgreSQL**: Banco de dados (Porta 5432)
    *   **API**: Backend Fastify (Porta 3333)
    *   **Jobs**: Scheduler para atualização automática (6h/Success ou 30m/Retry)
    *   **Web**: Frontend Next.js (Porta 3000)

4.  **Acessar**:
    Abra `http://localhost:3000` no seu navegador.

## ⚡ Forçar Atualização Manual

Se você precisa atualizar os dados imediatamente (sem esperar o agendador):

```bash
docker-compose exec jobs npx ts-node src/cli/force-update.ts
```
Este comando irá conectar na container de jobs e rodar o ciclo de atualização instantaneamente.

## 📋 Funcionalidades Principais

-   **Ranking Anual**: Pontuação baseada em performance relativa (não apenas vitórias).
-   **Insights**: Página dedicada com os destaques da semana (MVP, Rei do KDA, etc).
-   **Fila Global**: Alterne entre Solo/Duo e Flex em toda a aplicação instantaneamente.
-   **Perfil Detalhado**: Histórico de partidas, gráfico de evolução de PDL e maestrias.
-   **Status do Sistema**: Visualização em tempo real da última e próxima atualização de dados.
-   **Resiliência**: Sistema de agendamento inteligente que tenta reprocessar falhas automaticamente.

## 🛠 Tech Stack

-   **Frontend**: Next.js 14, TailwindCSS, Lucide Icons
-   **Backend**: Node.js, Fastify, Prisma ORM
-   **Banco de Dados**: PostgreSQL
-   **Infra**: Docker, Docker Compose
-   **API**: Riot Games API (Match-V5, Account-V1, League-V4)

## ⚖️ Regras de Pontuação (Canonical 60-30-10)

O sistema utiliza um motor de pontuação rígido (`scoring.engine.ts`) com score máximo de **100**.

### 1. Estrutura de Vitória (100 Ptos)
| Bloco | Max | Descrição |
|-------|-----|-----------|
| **Performance** | 60 | Métricas específicas por lane (CS, Dano, etc) calculadas via *ratio* vs oponente. |
| **Objetivos** | 30 | Torres (10), Dragões (10), Arauto (5), Barão (5). |
| **Disciplina** | 10 | Mortes vs Oponente (Menos=10, Igual=5, Mais=0). |

### 2. Pesos por Lane (Performance)
Cada função tem foco diferente para somar os 60 pontos de performance:
*   **TOP**: CS(15), Dano(15), Tankiness(10), KP(10), Visão(10)
*   **JUNGLE**: Objetivos Globais(25), Visão(15), KP(10), Gold(5), Dano(5)
*   **MID**: Dano(20), CS(15), KP(10), Visão(10), Gold(5)
*   **ADC**: CS(20), Dano(20), KP(10), Visão(5), Gold(5)
*   **SUP**: Visão(25), KP(15), Part. Objetivos(10), Gold(5), Dano(5)

### 3. Regras de Derrota (Teto 40)
*   **KP Mínimo**: Se seu Kill Participation for < 15%, o score é **0** (Filtro Anti-AFK).
*   **Teto**: Máximo de 40 pontos.
*   **Performance**: Pontua no máximo 20 (apenas métricas onde ratio > 1.0).
*   **Objetivos**: Pontua no máximo 10 (apenas métricas onde ratio > 1.0).
*   **Disciplina**: Pontua no máximo 10.

### 4. Exclusões
*   Partidas < 10 minutos.
*   Partidas fora da Season (Datas controladas).

*O cálculo é determinístico: `metricScore(ratio)` com piso 20% (ratio 0.7) e teto 100% (ratio 1.3).*

## 📂 Estrutura do Projeto

-   `/src/engine`: Lógica pura de cálculo (Scoring Engine).
-   `/src/services`: Integração com Riot API e Rate Limiting.
-   `/src/cli`: Scripts de linha de comando.
-   `/prisma`: Schema do banco de dados e migrações.
