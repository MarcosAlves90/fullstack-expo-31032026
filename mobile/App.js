import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Configurações e rótulos compartilhados pelas telas.
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREENS = {
  LIST: 'lista',
  DETAILS: 'detalhes'
};
const ORDER_OPTIONS = [
  { value: 'recentes', label: 'Recentes' },
  { value: 'az', label: 'A-Z' },
  { value: 'pendentes', label: 'Pendentes' }
];
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MISSING_API_MESSAGE = 'Configure EXPO_PUBLIC_API_URL no mobile/.env.';
const REQUEST_ERROR_MESSAGE = 'Não foi possível concluir a operação.';

function getTimestamp(value) {
  return value ? new Date(value).getTime() : 0;
}

function getTaskStatusLabel(done) {
  return done ? 'Concluída' : 'Pendente';
}

function createJsonRequest(method, payload) {
  return {
    method,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  };
}

// Mantém a comunicação com a API em um único ponto.
async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || REQUEST_ERROR_MESSAGE);
  }

  return data;
}

function sortTasks(tasks, order) {
  const items = [...tasks];

  if (order === 'az') {
    return items.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }

  if (order === 'pendentes') {
    return items.sort((a, b) => {
      if (a.concluida !== b.concluida) {
        return Number(a.concluida) - Number(b.concluida);
      }

      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }

  return items.sort((a, b) => {
    const timeA = getTimestamp(a.updatedAt || a.createdAt);
    const timeB = getTimestamp(b.updatedAt || b.createdAt);
    return timeB - timeA;
  });
}

// Componentes pequenos ficam aqui para evitar fragmentação precoce.
function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

function SortButton({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.sortButton, active && styles.sortButtonActive]}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function TaskCard({ task, saving, onOpen, onToggle, onDelete }) {
  return (
    <View style={styles.item}>
      <Pressable onPress={() => onOpen(task)} style={styles.itemContent}>
        <Text style={[styles.itemTitle, task.concluida && styles.doneText]}>{task.titulo}</Text>
        <Text style={styles.itemStatus}>{getTaskStatusLabel(task.concluida)}</Text>
      </Pressable>

      <View style={styles.itemActions}>
        <View style={styles.actionButton}>
          <Button title="Detalhes" onPress={() => onOpen(task)} disabled={saving} />
        </View>
        <View style={styles.actionButton}>
          <Button
            title={task.concluida ? 'Reabrir' : 'Concluir'}
            onPress={() => onToggle(task)}
            disabled={saving}
          />
        </View>
        <View style={styles.actionButton}>
          <Button
            title="Deletar"
            onPress={() => onDelete(task._id)}
            disabled={saving}
            color="#a00"
          />
        </View>
      </View>
    </View>
  );
}

function TaskListScreen({
  loading,
  saving,
  error,
  order,
  orderedTasks,
  text,
  onTextChange,
  onAdd,
  onOrderChange,
  onOpen,
  onToggle,
  onDelete
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          value={text}
          onChangeText={onTextChange}
          placeholder="Digite tarefa"
          style={styles.input}
          editable={!saving}
        />

        <View style={styles.buttonSpace}>
          <Button title="Adicionar" onPress={onAdd} disabled={saving} />
        </View>

        <Text style={styles.label}>Ordenar por</Text>
        <View style={styles.sortRow}>
          {ORDER_OPTIONS.map((option) => (
            <SortButton
              key={option.value}
              label={option.label}
              active={order === option.value}
              onPress={() => onOrderChange(option.value)}
            />
          ))}
        </View>

        <ErrorMessage message={error} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text>Carregando tarefas...</Text>
          </View>
        ) : (
          <FlatList
            data={orderedTasks}
            keyExtractor={(item) => item._id}
            contentContainerStyle={orderedTasks.length === 0 ? styles.emptyContainer : undefined}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text>Nenhuma tarefa cadastrada.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                saving={saving}
                onOpen={onOpen}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function TaskDetailsScreen({
  task,
  saving,
  error,
  editedTitle,
  onBack,
  onEditedTitleChange,
  onSave,
  onToggle,
  onDelete
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.buttonSpace}>
          <Button title="Voltar" onPress={onBack} disabled={saving} />
        </View>

        {!task ? (
          <View>
            <Text style={styles.title}>Tarefa não encontrada</Text>
            <Text>Ela pode ter sido removida.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>Detalhes da tarefa</Text>
            <Text style={styles.status}>Status: {getTaskStatusLabel(task.concluida)}</Text>

            <TextInput
              value={editedTitle}
              onChangeText={onEditedTitleChange}
              placeholder="Editar titulo"
              style={styles.input}
              editable={!saving}
            />

            <ErrorMessage message={error} />

            <View style={styles.buttonSpace}>
              <Button title="Salvar" onPress={onSave} disabled={saving} />
            </View>
            <View style={styles.buttonSpace}>
              <Button
                title={task.concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
                onPress={() => onToggle(task)}
                disabled={saving}
              />
            </View>
            <View style={styles.buttonSpace}>
              <Button
                title="Excluir tarefa"
                onPress={() => onDelete(task._id)}
                disabled={saving}
                color="#a00"
              />
            </View>

            {saving ? <ActivityIndicator style={styles.loader} /> : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  // Estado mínimo para controlar lista, navegação local e feedback de rede.
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [screen, setScreen] = useState(SCREENS.LIST);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  const [order, setOrder] = useState('recentes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedTask = tasks.find((item) => item._id === selectedTaskId) || null;
  const orderedTasks = sortTasks(tasks, order);

  async function syncTasks() {
    const data = await requestJson(API_URL);
    setTasks(data);
    return data;
  }

  async function loadTasks() {
    if (!API_URL) {
      setError(MISSING_API_MESSAGE);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await syncTasks();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  // Após qualquer escrita, o app recarrega a lista para manter o estado simples.
  async function runTaskMutation(action, onSuccess) {
    if (!API_URL) {
      setError(MISSING_API_MESSAGE);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await action();
      const data = await syncTasks();
      onSuccess?.(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function openDetails(task) {
    setSelectedTaskId(task._id);
    setEditedTaskTitle(task.titulo);
    setScreen(SCREENS.DETAILS);
    setError('');
  }

  function returnToList() {
    setScreen(SCREENS.LIST);
    setSelectedTaskId(null);
    setEditedTaskTitle('');
    setError('');
  }

  async function addTask() {
    const title = newTaskTitle.trim();

    if (!title) {
      setError('Digite um titulo para a tarefa.');
      return;
    }

    await runTaskMutation(
      () => requestJson(API_URL, createJsonRequest('POST', { titulo: title })),
      () => setNewTaskTitle('')
    );
  }

  async function saveTask() {
    if (!selectedTask) {
      return;
    }

    const title = editedTaskTitle.trim();

    if (!title) {
      setError('O título não pode ficar vazio.');
      return;
    }

    await runTaskMutation(() =>
      requestJson(`${API_URL}/${selectedTask._id}`, createJsonRequest('PUT', { titulo: title }))
    );
  }

  async function toggleTask(task) {
    await runTaskMutation(() =>
      requestJson(
        `${API_URL}/${task._id}`,
        createJsonRequest('PUT', { concluida: !task.concluida })
      )
    );
  }

  async function deleteTask(taskId) {
    await runTaskMutation(
      () => requestJson(`${API_URL}/${taskId}`, { method: 'DELETE' }),
      () => {
        if (taskId === selectedTaskId) {
          returnToList();
        }
      }
    );
  }

  useEffect(() => {
    loadTasks();
  }, []);

  if (screen === SCREENS.DETAILS) {
    return (
      <TaskDetailsScreen
        task={selectedTask}
        saving={saving}
        error={error}
        editedTitle={editedTaskTitle}
        onBack={returnToList}
        onEditedTitleChange={setEditedTaskTitle}
        onSave={saveTask}
        onToggle={toggleTask}
        onDelete={deleteTask}
      />
    );
  }

  return (
    <TaskListScreen
      loading={loading}
      saving={saving}
      error={error}
      order={order}
      orderedTasks={orderedTasks}
      text={newTaskTitle}
      onTextChange={setNewTaskTitle}
      onAdd={addTask}
      onOrderChange={setOrder}
      onOpen={openDetails}
      onToggle={toggleTask}
      onDelete={deleteTask}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    flex: 1,
    marginTop: 50,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  sortButton: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8
  },
  sortButtonActive: {
    backgroundColor: '#ddd'
  },
  error: {
    color: '#a00',
    marginBottom: 10
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  item: {
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#ddd'
  },
  itemContent: {
    marginBottom: 6
  },
  itemTitle: {
    fontSize: 15
  },
  itemStatus: {
    fontSize: 12
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  actionButton: {
    flex: 1,
    minWidth: 95,
    marginHorizontal: 4,
    marginBottom: 4
  },
  doneText: {
    textDecorationLine: 'line-through'
  },
  status: {
    marginBottom: 10
  },
  buttonSpace: {
    marginBottom: 8
  },
  loader: {
    marginTop: 10
  },
  emptyContainer: {
    flexGrow: 1
  }
});
