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

const ORDENACOES = [
  { value: 'recentes', label: 'Recentes' },
  { value: 'az', label: 'A-Z' },
  { value: 'pendentes', label: 'Pendentes' }
];

function toTime(value) {
  return value ? new Date(value).getTime() : 0;
}

function ordenarTarefas(lista, ordem) {
  const itens = [...lista];

  if (ordem === 'az') {
    return itens.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }

  if (ordem === 'pendentes') {
    return itens.sort((a, b) => {
      if (a.concluida !== b.concluida) {
        return Number(a.concluida) - Number(b.concluida);
      }

      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }

  return itens.sort((a, b) => {
    const timeA = toTime(a.updatedAt || a.createdAt);
    const timeB = toTime(b.updatedAt || b.createdAt);
    return timeB - timeA;
  });
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Nao foi possivel concluir a operacao.');
  }

  return data;
}

function SortButton({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sortButton, active && styles.sortButtonActive]}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

export default function App() {
  const API = process.env.EXPO_PUBLIC_API_URL;
  const [tarefas, setTarefas] = useState([]);
  const [texto, setTexto] = useState('');
  const [tela, setTela] = useState('lista');
  const [selecionadaId, setSelecionadaId] = useState(null);
  const [tituloEdicao, setTituloEdicao] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const tarefaSelecionada = tarefas.find((item) => item._id === selecionadaId) || null;
  const tarefasOrdenadas = ordenarTarefas(tarefas, ordem);

  async function sincronizarTarefas() {
    const data = await request(API);
    setTarefas(data);
    return data;
  }

  async function carregar() {
    if (!API) {
      setErro('Configure EXPO_PUBLIC_API_URL no mobile/.env.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      await sincronizarTarefas();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function executarAcao(acao, onSuccess) {
    if (!API) {
      setErro('Configure EXPO_PUBLIC_API_URL no mobile/.env.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      await acao();
      const data = await sincronizarTarefas();
      onSuccess?.(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function abrirDetalhes(tarefa) {
    setSelecionadaId(tarefa._id);
    setTituloEdicao(tarefa.titulo);
    setTela('detalhes');
    setErro('');
  }

  function voltarParaLista() {
    setTela('lista');
    setSelecionadaId(null);
    setTituloEdicao('');
    setErro('');
  }

  async function adicionar() {
    const titulo = texto.trim();

    if (!titulo) {
      setErro('Digite um titulo para a tarefa.');
      return;
    }

    await executarAcao(
      () =>
        request(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo })
        }),
      () => setTexto('')
    );
  }

  async function salvarEdicao() {
    if (!tarefaSelecionada) {
      return;
    }

    const titulo = tituloEdicao.trim();

    if (!titulo) {
      setErro('O titulo nao pode ficar vazio.');
      return;
    }

    await executarAcao(() =>
      request(`${API}/${tarefaSelecionada._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo })
      })
    );
  }

  async function alternarConclusao(tarefa) {
    await executarAcao(() =>
      request(`${API}/${tarefa._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: !tarefa.concluida })
      })
    );
  }

  async function deletar(id) {
    await executarAcao(
      () =>
        request(`${API}/${id}`, {
          method: 'DELETE'
        }),
      () => {
        if (id === selecionadaId) {
          voltarParaLista();
        }
      }
    );
  }

  useEffect(() => {
    carregar();
  }, [API]);

  if (tela === 'detalhes') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.buttonSpace}>
            <Button title="Voltar" onPress={voltarParaLista} disabled={salvando} />
          </View>

          {!tarefaSelecionada ? (
            <View>
              <Text style={styles.title}>Tarefa nao encontrada</Text>
              <Text>Ela pode ter sido removida.</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.title}>Detalhes da tarefa</Text>
              <Text style={styles.status}>
                Status: {tarefaSelecionada.concluida ? 'Concluida' : 'Pendente'}
              </Text>

              <TextInput
                value={tituloEdicao}
                onChangeText={setTituloEdicao}
                placeholder="Editar titulo"
                style={styles.input}
                editable={!salvando}
              />

              <ErrorMessage message={erro} />

              <View style={styles.buttonSpace}>
                <Button title="Salvar" onPress={salvarEdicao} disabled={salvando} />
              </View>
              <View style={styles.buttonSpace}>
                <Button
                  title={tarefaSelecionada.concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
                  onPress={() => alternarConclusao(tarefaSelecionada)}
                  disabled={salvando}
                />
              </View>
              <View style={styles.buttonSpace}>
                <Button
                  title="Excluir tarefa"
                  onPress={() => deletar(tarefaSelecionada._id)}
                  disabled={salvando}
                  color="#a00"
                />
              </View>

              {salvando ? <ActivityIndicator style={styles.loader} /> : null}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite tarefa"
          style={styles.input}
          editable={!salvando}
        />

        <View style={styles.buttonSpace}>
          <Button title="Adicionar" onPress={adicionar} disabled={salvando} />
        </View>

        <Text style={styles.label}>Ordenar por</Text>
        <View style={styles.sortRow}>
          {ORDENACOES.map((opcao) => (
            <SortButton
              key={opcao.value}
              label={opcao.label}
              active={ordem === opcao.value}
              onPress={() => setOrdem(opcao.value)}
            />
          ))}
        </View>

        <ErrorMessage message={erro} />

        {carregando ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text>Carregando tarefas...</Text>
          </View>
        ) : (
          <FlatList
            data={tarefasOrdenadas}
            keyExtractor={(item) => item._id}
            contentContainerStyle={
              tarefasOrdenadas.length === 0 ? styles.emptyContainer : undefined
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text>Nenhuma tarefa cadastrada.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Pressable onPress={() => abrirDetalhes(item)} style={styles.itemContent}>
                  <Text style={[styles.itemTitle, item.concluida ? styles.doneText : undefined]}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.itemStatus}>
                    {item.concluida ? 'Concluida' : 'Pendente'}
                  </Text>
                </Pressable>

                <View style={styles.itemActions}>
                  <View style={styles.actionButton}>
                    <Button
                      title="Detalhes"
                      onPress={() => abrirDetalhes(item)}
                      disabled={salvando}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title={item.concluida ? 'Reabrir' : 'Concluir'}
                      onPress={() => alternarConclusao(item)}
                      disabled={salvando}
                    />
                  </View>
                  <View style={styles.actionButton}>
                    <Button
                      title="Deletar"
                      onPress={() => deletar(item._id)}
                      disabled={salvando}
                      color="#a00"
                    />
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
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
