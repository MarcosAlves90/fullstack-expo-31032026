const mongoose = require('mongoose');

const TarefaSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    concluida: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tarefa', TarefaSchema);
