import { Client, Account, Databases, ID, Query, Permission, Role } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'dummy_project_id');

export const account = new Account(client);
export const databases = new Databases(client);

export { ID, Query, Permission, Role };

export const DATABASE_ID = import.meta.env.VITE_DATABASE_ID || 'financeiro_db';

export const COLLECTIONS = {
  RECEITAS: 'receitas',
  DESPESAS: 'despesas',
  PARCELAMENTOS: 'parcelamentos',
  CARTOES: 'cartoes',
  PATRIMONIO: 'patrimonio',
  DIVIDAS: 'dividas',
  METAS: 'metas',
  PRODUTIVIDADE: 'produtividade',
  APROVEITAMENTO: 'aproveitamento_mensal',
  CATEGORIAS: 'categorias_customizadas',
  FEEDBACKS: 'feedbacks'
};
