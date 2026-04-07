const mongoose = require('mongoose');

// Schema enxuto: título identifica a tarefa e concluída controla o status.
const tarefaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'Informe o título da tarefa.'],
      trim: true
    },
    concluida: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tarefa', tarefaSchema);
