import { databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role, Query } from '../lib/appwrite';

/*
  Serviço de snapshots (histórico) de Patrimônio e Dívidas.
  Cada vez que o usuário cria ou edita um ativo/dívida, gravamos um registro
  com o valor naquele momento, permitindo montar a evolução real ao longo do tempo.

  Collection: historico_snapshots
  Campos: userId, tipo ('patrimonio'|'divida'), refId, nome, valor, data, createdAt
*/

export const historicoService = {
  // Registra um snapshot. Falha de forma silenciosa (não quebra o fluxo principal).
  async registrar({ userId, tipo, refId, nome, valor }) {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.HISTORICO,
        ID.unique(),
        {
          userId,
          tipo,
          refId: String(refId || ''),
          nome: String(nome || ''),
          valor: parseFloat(valor) || 0,
          data: new Date().toISOString()
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
      console.log(`✅ [Histórico] Snapshot registrado (${tipo}):`, doc.$id, '| valor:', valor);
      return doc;
    } catch (e) {
      console.error(`❌ [Histórico] FALHA ao registrar snapshot (${tipo}):`, e.message);
      return null;
    }
  },

  // Lista todos os snapshots de um tipo, ordenados por data
  async listar(userId, tipo) {
    try {
      let todos = [];
      let offset = 0;
      const batch = 100;
      let total = null;
      while (true) {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.HISTORICO, [
          Query.equal('userId', userId),
          Query.equal('tipo', tipo),
          Query.limit(batch),
          Query.offset(offset)
        ]);
        todos = [...todos, ...res.documents];
        if (total === null) total = res.total;
        if (todos.length >= total || res.documents.length < batch) break;
        offset += batch;
      }
      console.log(`📊 [Histórico] ${todos.length} snapshot(s) carregado(s) para tipo "${tipo}"`);
      return todos.sort((a, b) => new Date(a.data) - new Date(b.data));
    } catch (e) {
      console.error(`❌ [Histórico] FALHA ao listar (${tipo}):`, e.message);
      return [];
    }
  }
};