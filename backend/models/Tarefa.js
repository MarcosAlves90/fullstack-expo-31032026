const mongoose = require('mongoose');

const TarefaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  concluida: { type: Boolean, default: false }
});

module.exports = mongoose.model('Tarefa', TarefaSchema);
