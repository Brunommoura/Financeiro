import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';

export const initVerificarPersistencia = (userId) => {
  if (!userId) return;

  window.verificarPersistencia = async () => {
    console.log('🔍 Verificando persistência de dados no Appwrite...\n');

    const collections = [
      { nome: 'Cartões',          id: COLLECTIONS.CARTOES },
      { nome: 'Patrimônio',       id: COLLECTIONS.PATRIMONIO },
      { nome: 'Dívidas',          id: COLLECTIONS.DIVIDAS },
      { nome: 'Metas',            id: COLLECTIONS.METAS },
      { nome: 'Receitas',         id: COLLECTIONS.RECEITAS },
      { nome: 'Despesas',         id: COLLECTIONS.DESPESAS },
      { nome: 'Parcelamentos',    id: COLLECTIONS.PARCELAMENTOS },
      { nome: 'Categorias',       id: COLLECTIONS.CATEGORIAS },
      { nome: 'Aproveitamento',   id: COLLECTIONS.APROVEITAMENTO },
      { nome: 'Produtividade',    id: COLLECTIONS.PRODUTIVIDADE },
    ];

    for (const col of collections) {
      if (!col.id) {
        console.log(`❌ ${col.nome}: ERRO — Collection ID indefinido em COLLECTIONS`);
        continue;
      }
      try {
        const res = await databases.listDocuments(DATABASE_ID, col.id, [
          Query.equal('userId', userId),
          Query.limit(1)
        ]);
        const total = res.total;
        const status = total > 0 ? '✅' : '⚠️ ';
        console.log(`${status} ${col.nome}: ${total} registro(s) no Appwrite`);
      } catch (err) {
        console.log(`❌ ${col.nome}: ERRO — ${err.message}`);
      }
    }

    console.log('\n✅ Verificação concluída.');
    console.log('⚠️  = collection vazia (pode ser normal se nunca cadastrou)');
    console.log('❌  = erro de conexão ou collection inexistente');
  };

  console.log('💡 Para verificar persistência, execute: window.verificarPersistencia()');
};
