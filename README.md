# Projeto Fullstack de Tarefas

Aplicação fullstack simples para cadastro de tarefas, com frontend mobile em Expo/React Native e backend em Express + MongoDB.

O projeto foi mantido propositalmente enxuto. A regra aqui é evitar overengineering: poucos arquivos, responsabilidades claras e fluxo direto entre app, API e banco.

## Autores

- Lyntter de Jesus Paiva
- Marcos Alves Lopes Júnior
- Matheus Souza Rodrigues

## Stack

- `mobile`: Expo + React Native
- `backend`: Node.js + Express
- `database`: MongoDB via Mongoose

## Estrutura

```text
.
|-- backend/
|   |-- models/
|   |   `-- Tarefa.js
|   |-- .env
|   |-- package.json
|   `-- server.js
|-- mobile/
|   |-- assets/
|   |-- .env
|   |-- app.json
|   |-- App.js
|   |-- index.js
|   `-- package.json
|-- .gitignore
`-- README.md
```

## Responsabilidade de Cada Parte

### `backend/server.js`

Arquivo principal da API.

- carrega variáveis de ambiente
- conecta no MongoDB
- registra middlewares globais
- define as rotas CRUD de tarefas
- centraliza o tratamento de erros

### `backend/models/Tarefa.js`

Define o schema da coleção `tarefas`.

- `título`: nome da tarefa
- `concluída`: status booleano
- `timestamps`: cria `createdAt` e `updatedAt`

### `mobile/App.js`

Arquivo principal da interface mobile.

- carrega tarefas da API
- cria, atualiza, conclui e remove tarefas
- controla a navegação local entre lista e detalhes
- organiza a ordenação da lista

A interface continua em um único arquivo porque o projeto ainda é pequeno. Separar em muitas telas, hooks e services agora aumentaria custo cognitivo sem ganho real.

## Fluxo da Aplicação

1. O app mobile lê `EXPO_PUBLIC_API_URL`.
2. A lista inicial chama `GET /tarefas`.
3. Toda alteração (`POST`, `PUT`, `DELETE`) executa na API.
4. Depois da escrita, o app recarrega a lista para manter o estado simples e consistente.
5. O backend persiste os dados no MongoDB usando o model `Tarefa`.

## Variáveis de Ambiente

### Backend: `backend/.env`

```env
MONGODB_URI=sua-string-do-mongodb
PORT=3000
```

### Mobile: `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/tarefas
```

Se o app rodar em emulador ou celular físico, `localhost` pode não funcionar. Nesse caso use o IP da máquina onde a API está rodando.

## Como Rodar

### 1. Subir o backend

```bash
cd backend
npm install
npm start
```

### 2. Subir o mobile

```bash
cd mobile
npm install
npm start
```

## Rotas da API

- `GET /tarefas`: lista tarefas
- `POST /tarefas`: cria tarefa
- `PUT /tarefas/:id`: atualiza título ou status
- `DELETE /tarefas/:id`: remove tarefa

Exemplo de payload para criação:

```json
{
  "título": "Estudar arquitetura",
  "concluída": false
}
```

## Decisões Técnicas

- O backend ficou em um único `server.js` porque o número de casos ainda é pequeno.
- O frontend usa componentes pequenos dentro de `App.js` para reduzir repetição sem espalhar a lógica em vários arquivos.
- Depois de cada mutação, o app faz refetch da lista. Isso reduz complexidade de sincronização local e evita bugs de estado.

## Melhorias Futuras

- adicionar testes automatizados no backend e no mobile
- separar camadas do backend quando surgirem mais entidades ou regras
- extrair componentes/telas do mobile quando a interface crescer
- adicionar validação de payload mais explícita e observabilidade básica

## Observações

- Os arquivos `.env` já estão ignorados no `.gitignore`.
- Credenciais reais não devem ser compartilhadas fora do ambiente de desenvolvimento.
