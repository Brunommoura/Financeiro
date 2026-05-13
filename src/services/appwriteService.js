import { databases, DATABASE_ID, ID, Query, Permission, Role } from '../lib/appwrite';

export const appwriteService = {
  // Generic create
  async criar(collectionId, userId, dados) {
    if (!userId) throw new Error("Usuário não autenticado");
    
    // Add userId to document
    const documento = { ...dados, userId, createdAt: new Date().toISOString() };
    
    const doc = await databases.createDocument(
      DATABASE_ID,
      collectionId,
      ID.unique(),
      documento,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );
    doc.id = doc.$id;
    return doc;
  },

  // Batch create
  async criarVarios(collectionId, userId, itens) {
    if (!userId) throw new Error("Usuário não autenticado");
    
    const promises = itens.map(item => this.criar(collectionId, userId, item));
    return await Promise.all(promises);
  },

  // Generic list
  async listar(collectionId, userId, extraQueries = []) {
    if (!userId) throw new Error("Usuário não autenticado");

    const queries = [
      Query.equal('userId', userId),
      Query.limit(500), // Default limit, can be adjusted
      ...extraQueries
    ];
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        queries
      );
      
      // Map Appwrite documents to our simple objects
      return response.documents.map(doc => {
        const item = { ...doc };
        // We might need to handle ID mapping since appwrite uses $id
        if (!item.id && item.$id) item.id = item.$id;
        return item;
      });
    } catch (e) {
      // Return empty array if collection doesn't exist or is empty
      console.warn(`Erro ao listar ${collectionId}:`, e);
      return [];
    }
  },

  // Generic update
  async atualizar(collectionId, documentId, dados) {
    // Remove appwrite specific keys before update if they exist
    const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...cleanData } = dados;
    
    return await databases.updateDocument(
      DATABASE_ID,
      collectionId,
      documentId,
      cleanData
    );
  },

  // Batch update
  async atualizarVarios(collectionId, itemsToUpdate) {
    const promises = itemsToUpdate.map(item => this.atualizar(collectionId, item.$id || item.id, item));
    return await Promise.all(promises);
  },

  // Generic delete
  async deletar(collectionId, documentId) {
    return await databases.deleteDocument(
      DATABASE_ID,
      collectionId,
      documentId
    );
  },

  // Batch delete
  async deletarVarios(collectionId, documentIds) {
    const promises = documentIds.map(id => this.deletar(collectionId, id));
    return await Promise.all(promises);
  }
};
