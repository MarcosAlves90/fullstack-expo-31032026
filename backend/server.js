const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Tarefa = require('./models/Tarefa');

const envPath = path.resolve(__dirname, '.env');
const dotenvResult = dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function describeMongoUri(uri) {
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

console.log('[startup] cwd:', process.cwd());
console.log('[startup] __dirname:', __dirname);
console.log('[startup] NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('[startup] PORT:', PORT);
console.log('[startup] backend/.env loaded:', !dotenvResult.error);
if (dotenvResult.error) {
  console.log('[startup] dotenv info:', dotenvResult.error.message);
}
console.log('[startup] MONGODB_URI present:', Boolean(MONGODB_URI));
console.log('[startup] MONGODB_URI summary:', describeMongoUri(MONGODB_URI));

app.use(cors());
app.use(express.json());

mongoose.connection.on('connecting', () => {
  console.log('[mongoose] connecting');
});

mongoose.connection.on('connected', () => {
  console.log('[mongoose] connected');
});

mongoose.connection.on('open', () => {
  console.log('[mongoose] open');
});

mongoose.connection.on('disconnected', () => {
  console.log('[mongoose] disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('[mongoose] connection error:', error.message);
});

app.post('/tarefas', async (req, res) => {
  const tarefa = await Tarefa.create(req.body);
  res.json(tarefa);
});

app.get('/tarefas', async (req, res) => {
  const tarefas = await Tarefa.find().sort({ createdAt: -1, _id: -1 });
  res.json(tarefas);
});

app.put('/tarefas/:id', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'ID de tarefa invalido' });
  }

  const tarefa = await Tarefa.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tarefa) {
    return res.status(404).json({ error: 'Tarefa nao encontrada' });
  }

  res.json(tarefa);
});

app.delete('/tarefas', async (req, res) => {
  res.status(400).json({ error: 'Informe o ID da tarefa na URL' });
});

app.delete('/tarefas/:id', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'ID de tarefa invalido' });
  }

  const tarefa = await Tarefa.findByIdAndDelete(req.params.id);

  if (!tarefa) {
    return res.status(404).json({ error: 'Tarefa nao encontrada' });
  }

  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  console.error('[request] failure', {
    method: req.method,
    path: req.originalUrl,
    errorName: error.name,
    errorMessage: error.message,
    mongoReadyState: mongoose.connection.readyState
  });

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'ID de tarefa invalido' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI nao definida');
  }

  console.log('[startup] trying MongoDB connection...');
  await mongoose.connect(MONGODB_URI);
  console.log('[startup] MongoDB connection finished successfully');

  app.listen(PORT, () => {
    console.log(`[startup] servidor rodando na porta ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[startup] fatal error:', error);
  process.exit(1);
});
