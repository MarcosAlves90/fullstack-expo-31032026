require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Tarefa = require('./models/Tarefa');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI nao definida');
}

mongoose.connect(
  MONGODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('MongoDB Atlas conectado'))
.catch(err => console.log(err));

app.post('/tarefas', async(req, res) => {
  const t = await Tarefa.create(req.body);
  res.json(t);
});

app.get('/tarefas', async(req, res) => {
  const t = await Tarefa.find();
  res.json(t);
});

app.put('/tarefas/:id', async(req, res) => {
  const t = await Tarefa.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(t);
});

app.delete('/tarefas/:id', async(req, res) => {
  await Tarefa.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log('Servidor rodando'));
