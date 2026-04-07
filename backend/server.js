const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Tarefa = require('./models/Tarefa');

// Carrega o .env do backend explicitamente para evitar dependência do diretório atual.
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const TASKS_ROUTE = '/tarefas';
const TASKS_SORT = { createdAt: -1, _id: -1 };

function summarizeMongoUri(uri) {
  if (!uri) {
    return { present: false };
  }

  try {
    const parsed = new URL(uri);

    return {
      present: true,
      protocol: parsed.protocol,
      host: parsed.host,
      database: parsed.pathname.replace(/^\//, '') || '(default)',
      hasQuery: Boolean(parsed.search)
    };
  } catch (error) {
    return {
      present: true,
      parseError: error.message
    };
  }
}

function isValidTaskId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateTaskId(req, res, next) {
  if (!isValidTaskId(req.params.id)) {
    return res.status(400).json({ error: 'ID de tarefa inválido' });
  }

  next();
}

function logStartupSummary() {
  console.log('[startup] PORT:', PORT);
  console.log('[startup] MONGODB_URI summary:', summarizeMongoUri(MONGODB_URI));
}

function registerMongoLogs() {
  mongoose.connection.on('connecting', () => {
    console.log('[mongoose] connecting');
  });

  mongoose.connection.on('connected', () => {
    console.log('[mongoose] connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[mongoose] disconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[mongoose] connection error:', error.message);
  });
}

function getValidationMessage(error) {
  return Object.values(error.errors || {})
    .map((item) => item.message)
    .filter(Boolean)
    .join(', ');
}

// Middlewares globais da API.
app.use(cors());
app.use(express.json());

// Rotas CRUD da entidade principal do projeto.
app.post(TASKS_ROUTE, async (req, res) => {
  const tarefa = await Tarefa.create(req.body);
  return res.status(201).json(tarefa);
});

app.get(TASKS_ROUTE, async (req, res) => {
  const tarefas = await Tarefa.find().sort(TASKS_SORT);
  return res.json(tarefas);
});

app.put(`${TASKS_ROUTE}/:id`, validateTaskId, async (req, res) => {
  const tarefa = await Tarefa.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tarefa) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  return res.json(tarefa);
});

app.delete(TASKS_ROUTE, (req, res) => {
  return res.status(400).json({ error: 'Informe o ID da tarefa na URL' });
});

app.delete(`${TASKS_ROUTE}/:id`, validateTaskId, async (req, res) => {
  const tarefa = await Tarefa.findByIdAndDelete(req.params.id);

  if (!tarefa) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  return res.json({ ok: true });
});

// Traduz erros comuns do Mongo/Mongoose para respostas HTTP previsíveis.
app.use((error, req, res, next) => {
  console.error('[request] failure', {
    method: req.method,
    path: req.originalUrl,
    errorName: error.name,
    errorMessage: error.message,
    mongoReadyState: mongoose.connection.readyState
  });

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'ID de tarefa inválido' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: getValidationMessage(error) || 'Dados da tarefa inválidos'
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não definida');
  }

  console.log('[startup] connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[startup] MongoDB connected');
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`[startup] servidor rodando na porta ${PORT}`);
  });
}

async function startServer() {
  logStartupSummary();
  registerMongoLogs();
  await connectDatabase();
  startHttpServer();
}

startServer().catch((error) => {
  console.error('[startup] fatal error:', error);
  process.exit(1);
});
