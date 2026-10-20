# bot-crm

RPA em [Playwright](https://playwright.dev/) que automatiza a gestão de **Itens da Fila** no **Microsoft Dynamics 365 (CRM)**. O robô faz login com uma conta Microsoft, guarda a sessão e, com ela, distribui os itens pendentes entre a equipe e limpa da fila os itens que já foram respondidos.

## Como funciona

O projeto tem três robôs, cada um com um `.bat` para rodar no Windows (manual ou pelo Agendador de Tarefas):

| Robô | Arquivo | `.bat` | O que faz |
|---|---|---|---|
| **Login** | `prod/auth-setup.spec.ts` | `run-login.bat` | Faz login na Microsoft com e-mail e senha, abre o Dynamics e salva cookies/tokens em `prod/.auth/session.json`. |
| **Distribuir fila** | `prod/route-queue-items.spec.ts` | `run-prod-queue.bat` | Abre **Itens da Fila**, filtra itens **sem "Trabalhado por"** e com **"Resposta Enviada?" começando com `N`**, e encaminha (**Rota → Usuário/Equipe**) um item por vez para cada pessoa de `QUEUE_USERS`, em rodízio (round-robin), até a grade esvaziar. Para sozinho em 500 itens por segurança. |
| **Remover respondidos** | `test/remover-itens-respondidos.spec.ts` | `run-remover.bat` | Abre **Itens da Fila**, filtra **"Resposta Enviada?" começando com `S`**, seleciona todas as linhas e clica em **Remover**. Se não houver linhas, encerra sem fazer nada. |

```
run-login.bat ──► session.json ──┬──► run-prod-queue.bat  (distribui itens novos)
                                 └──► run-remover.bat     (remove itens já respondidos)
```

Os robôs de fila **não fazem login**: reaproveitam a sessão salva. Rode o login antes e de novo sempre que a sessão expirar (o login pede `max_age=86400`, ou seja, cerca de 24 h).

Cada `.bat` grava a saída em `logs/<robo>.log`, com data/hora e `exit code` (0 = sucesso).

## Requisitos

- Windows (para os `.bat`; os testes rodam em qualquer sistema operacional)
- [Node.js](https://nodejs.org/) 18 ou superior
- Uma conta Microsoft com acesso ao Dynamics **sem MFA interativo** (o login é por e-mail e senha)

## Instalação

```bash
git clone <url-do-repo> bot-crm
cd bot-crm
npm install
npx playwright install chromium
```

Crie o `.env` a partir do modelo e preencha os valores:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
|---|---|
| `CRM_LOGIN_URL` | URL da tela de login da Microsoft que redireciona para o Dynamics (abra o CRM numa janela anônima e copie a URL da tela de login). |
| `CRM_EMAIL` | E-mail da conta usada pelo robô. |
| `CRM_PASSWORD` | Senha dessa conta. |
| `CRM_DASHBOARD_URL` | URL do dashboard do app no Dynamics, onde fica o menu **Itens da Fila**. |
| `QUEUE_USERS` | Quem recebe os itens, na ordem do rodízio. Formato `termo:Nome Completo;termo:Nome Completo`, em que o *termo* é o que se digita na busca de usuário e o *Nome Completo* tem que ser **idêntico** ao que aparece no Dynamics. |

Exemplo de `QUEUE_USERS`:

```
QUEUE_USERS=joao:João da Silva;maria:Maria Souza;pedro:Pedro Lima
```

Se faltar alguma variável, o robô para com a mensagem `Variável de ambiente obrigatória ausente: <NOME>`.

## Uso

Rodando pelos `.bat` (eles funcionam de qualquer pasta, porque usam o diretório do próprio script):

```bat
run-login.bat
run-prod-queue.bat
run-remover.bat
```

Ou direto pelo Playwright:

```bash
npx playwright test prod/auth-setup.spec.ts
npx playwright test prod/route-queue-items.spec.ts
npx playwright test test/remover-itens-respondidos.spec.ts

# com o navegador visível (bom para depurar)
npx playwright test prod/route-queue-items.spec.ts --headed
```

### Agendamento sugerido (Agendador de Tarefas do Windows)

1. `run-login.bat`: uma vez por dia, antes dos outros (ex.: 06:55).
2. `run-remover.bat`: periodicamente, para tirar da fila o que já foi respondido.
3. `run-prod-queue.bat`: periodicamente, logo depois do remover, para distribuir os itens novos.

## Estrutura

```
bot-crm/
├── env.ts                                 # carrega e valida o .env
├── prod/
│   ├── auth-setup.spec.ts                 # robô de login
│   ├── route-queue-items.spec.ts          # robô de distribuição (round-robin)
│   └── .auth/session.json                 # sessão salva (gerada, fora do git)
├── test/
│   └── remover-itens-respondidos.spec.ts  # robô de remoção
├── run-login.bat
├── run-prod-queue.bat
├── run-remover.bat
├── logs/                                  # logs de execução (fora do git)
├── .env.example
└── package.json
```

## Segurança

- **Nunca faça commit do `.env` nem de `prod/.auth/session.json`.** O `session.json` tem cookies e tokens válidos da conta Microsoft: quem tiver esse arquivo entra no CRM sem senha. Os dois já estão no `.gitignore`.
- `logs/` também fica fora do repositório, porque traz nomes de colaboradores.
- Se a senha já esteve em algum arquivo compartilhado ou commitado, troque-a.

## Solução de problemas

| Sintoma | Causa provável / correção |
|---|---|
| Timeout logo ao abrir "Itens da Fila" | A sessão expirou: rode `run-login.bat` de novo. |
| Login para em "Sign in" ou "Yes" | A conta passou a exigir MFA ou mudou o idioma da tela de login (os seletores estão em inglês). |
| `treeitem` não encontrado ao rotear | O nome em `QUEUE_USERS` não bate exatamente com o do Dynamics. |
| Seletores quebrando de repente | A Microsoft mudou a interface do Dynamics: regrave o trecho com `npx playwright codegen <CRM_DASHBOARD_URL>`. |
