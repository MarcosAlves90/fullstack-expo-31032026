import { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';

export default function App() {
  const [tarefas, setTarefas] = useState([]);
  const [texto, setTexto] = useState('');
  const API = process.env.EXPO_PUBLIC_API_URL;

  async function carregar() {
    if (!API) return;
    const res = await fetch(API);
    const data = await res.json();
    setTarefas(data);
  }

  async function adicionar() {
    if (!texto || !API) return;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: texto })
    });
    setTexto('');
    carregar();
  }

  async function deletar(id) {
    if (!API) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    carregar();
  }

  useEffect(() => { carregar(); }, []);

  return (
    <View style={{ marginTop: 50, padding: 20 }}>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Digite tarefa"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Adicionar" onPress={adicionar} />
      <FlatList
        data={tarefas}
        keyExtractor={item => item._id}
        renderItem={({ item }) =>
          <View style={{ padding: 10, margin: 5, backgroundColor: '#ddd' }}>
            <Text>{item.titulo}</Text>
            <Button title="Deletar" onPress={() => deletar(item._id)} />
          </View>
        }
      />
    </View>
  );
}
