import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, X, AlertTriangle, Loader2 } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';
import { COLLECTIONS, ID, Permission, Role, Query } from '../lib/appwrite';
import { databases, DATABASE_ID } from '../lib/appwrite';

// Como o Appwrite config exporta databases e DATABASE_ID, podemos usá-los diretamente ou usar appwriteService.
// Mas appwriteService.criar não recebe permissões como no snippet, entao usaremos appwriteService.criar que já usa isso, 
// ou databases.createDocument para ter mais controle caso necessário.
// O appwriteService.criar já adiciona permissões: appwriteService.js precisa ser verificado.
// Para ser fiel ao snippet, vou usar databases.createDocument.

export default function ImportModal({ isOpen, onClose, initialType = 'despesas', user, onImportSuccess }) {
  const [tipo, setTipo] = useState(initialType);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipo(initialType);
      setFile(null);
      setPreview([]);
      setLinhas([]);
      setImportResult(null);
      setErrorMsg('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const baixarTemplate = () => {
    let dados;
    if (tipo === 'despesas') {
      dados = [
        {
          Data: '10/05/2026',
          Descricao: 'Supermercado Extra',
          Tipo: 'Variável',
          Categoria: 'Alimentação',
          Valor: 350.00,
          FormaPagamento: 'Dinheiro',
          Status: 'Pago',
          Observacoes: ''
        },
        {
          Data: '05/05/2026',
          Descricao: 'Aluguel',
          Tipo: 'Fixa',
          Categoria: 'Moradia',
          Valor: 2000.00,
          FormaPagamento: 'Transferência',
          Status: 'Pago',
          Observacoes: 'Maio/26'
        }
      ];
    } else {
      dados = [
        {
          Descricao: 'Notebook Dell',
          ValorTotal: 3000.00,
          NumeroParcelas: 12,
          DataPrimeiraParcela: '10/01/2026',
          Cartao: 'Nubank',
          Categoria: 'Tecnologia',
          Observacoes: ''
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `modelo_${tipo}.xlsx`);
  };

  const lerArquivo = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(fileObj);
    });
  };

  const lerCSV = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'string' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet);
          resolve(json);
        } catch(err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(fileObj);
    });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('O arquivo deve ter no máximo 5MB.');
      return;
    }

    setFile(selected);
    setErrorMsg('');
    try {
      let data = [];
      if (selected.name.endsWith('.csv')) {
        data = await lerCSV(selected);
      } else {
        data = await lerArquivo(selected);
      }
      setLinhas(data);
      setPreview(data.slice(0, 5));
    } catch (err) {
      setErrorMsg('Erro ao ler o arquivo. Certifique-se de que é um formato válido.');
    }
  };

  const calcularDataVencimento = (dataCompra, diaVencimento) => {
    if (!diaVencimento) return null;
    const d = new Date(dataCompra);
    // Lógica simplificada: mês seguinte no dia do vencimento
    d.setMonth(d.getMonth() + 1);
    d.setDate(diaVencimento);
    return d;
  };

  const importarDespesas = async (linhasData, userId) => {
    const erros = [];
    const sucessos = [];

    for (let i = 0; i < linhasData.length; i++) {
      const linha = linhasData[i];
      try {
        if (!linha.Descricao || !linha.Valor || !linha.Data) {
          erros.push({ linha: i + 2, erro: 'Campos obrigatórios faltando (Descrição, Valor, Data)' });
          continue;
        }

        let dataISO;
        if (typeof linha.Data === 'string' && linha.Data.includes('/')) {
           const [dia, mes, ano] = linha.Data.split('/');
           dataISO = new Date(ano.length === 2 ? `20${ano}` : ano, mes - 1, dia).toISOString();
        } else {
           // Se o excel formatou como data (numero sequencial do excel) ou algo diferente, vamos tentar Date normal
           dataISO = new Date(linha.Data).toISOString();
           if (isNaN(new Date(dataISO).getTime())) {
               erros.push({ linha: i + 2, erro: 'Formato de data inválido' });
               continue;
           }
        }

        const valor = parseFloat(String(linha.Valor).replace(',', '.'));
        if (isNaN(valor) || valor <= 0) {
          erros.push({ linha: i + 2, erro: 'Valor inválido' });
          continue;
        }

        const doc = {
          data: dataISO.split('T')[0],
          descricao: String(linha.Descricao),
          tipo: linha.Tipo || 'Variável',
          categoria: linha.Categoria || 'Outros',
          valor,
          formaPagamento: linha.FormaPagamento || 'Débito',
          status: linha.Status || 'Pendente',
          observacoes: linha.Observacoes || ''
        };

        await appwriteService.criar(COLLECTIONS.DESPESAS, userId, doc);
        sucessos.push(linha);
      } catch (error) {
        erros.push({ linha: i + 2, erro: error.message });
      }
    }

    return { sucessos: sucessos.length, erros };
  };

  const importarParcelamentos = async (linhasData, userId) => {
    const erros = [];
    const sucessos = [];
    
    // Precisamos buscar cartoes para o appwriteService
    let cartoes = [];
    try {
      cartoes = await appwriteService.listar(COLLECTIONS.CARTOES, userId);
    } catch(e) {
      // ignore
    }

    for (let i = 0; i < linhasData.length; i++) {
      const linha = linhasData[i];
      try {
        if (!linha.Descricao || !linha.ValorTotal || !linha.NumeroParcelas || !linha.DataPrimeiraParcela) {
          erros.push({ linha: i + 2, erro: 'Campos obrigatórios faltando' });
          continue;
        }

        const cartao = cartoes.find(c => c.name.toLowerCase() === String(linha.Cartao || '').toLowerCase());

        let dataPrimeira;
        if (typeof linha.DataPrimeiraParcela === 'string' && linha.DataPrimeiraParcela.includes('/')) {
            const [dia, mes, ano] = linha.DataPrimeiraParcela.split('/');
            dataPrimeira = new Date(ano.length === 2 ? `20${ano}` : ano, mes - 1, dia);
        } else {
            dataPrimeira = new Date(linha.DataPrimeiraParcela);
            if (isNaN(dataPrimeira.getTime())) {
               erros.push({ linha: i + 2, erro: 'Data inválida' });
               continue;
            }
        }

        const valorTotal = parseFloat(String(linha.ValorTotal).replace(',', '.'));
        const numParcelas = parseInt(linha.NumeroParcelas);
        
        if (isNaN(valorTotal) || isNaN(numParcelas) || numParcelas < 2 || numParcelas > 60) {
            erros.push({ linha: i + 2, erro: 'Valor ou parcelas inválidas' });
            continue;
        }
        
        const valorParcela = parseFloat((valorTotal / numParcelas).toFixed(2));

        const parcelamentoDoc = {
          descricao: String(linha.Descricao),
          valorTotal,
          numeroParcelas: numParcelas,
          valorParcela,
          dataPrimeiraParcela: dataPrimeira.toISOString().split('T')[0],
          cartaoId: cartao ? String(cartao.id) : '',
          categoria: linha.Categoria || 'Outros',
          parcelasPagas: 0,
          status: 'active',
          observacoes: linha.Observacoes || ''
        };

        const novoMaster = await appwriteService.criar(COLLECTIONS.PARCELAMENTOS, userId, parcelamentoDoc);

        const despesasDocs = [];
        let cumulative = 0;
        
        for (let j = 0; j < numParcelas; j++) {
          const dataParcela = new Date(dataPrimeira);
          dataParcela.setMonth(dataParcela.getMonth() + j);

          let val = valorParcela;
          if (j === numParcelas - 1) {
              val = parseFloat((valorTotal - cumulative).toFixed(2));
          } else {
              cumulative += val;
          }

          despesasDocs.push({
            parcelamentoId: novoMaster.id,
            data: dataParcela.toISOString().split('T')[0],
            descricao: `${linha.Descricao} - Parcela ${j + 1}/${numParcelas}`,
            tipo: 'Parcelada',
            categoria: linha.Categoria || 'Outros',
            valor: val,
            formaPagamento: cartao ? 'Crédito' : 'Débito',
            cartaoId: cartao ? String(cartao.id) : '',
            status: 'Pendente'
          });
        }
        
        await appwriteService.criarVarios(COLLECTIONS.DESPESAS, userId, despesasDocs);

        sucessos.push(linha);
      } catch (error) {
        erros.push({ linha: i + 2, erro: error.message });
      }
    }
    return { sucessos: sucessos.length, erros };
  };

  const handleImport = async () => {
    if (!linhas || linhas.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    let res;
    if (tipo === 'despesas') {
      res = await importarDespesas(linhas, user.$id);
    } else {
      res = await importarParcelamentos(linhas, user.$id);
    }

    setIsImporting(false);
    setImportResult(res);
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  const getHeaders = () => {
    if (preview.length === 0) return [];
    return Object.keys(preview[0]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Importar Planilha</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {importResult ? (
          <div className="animate-fade">
            <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{importResult.erros.length === 0 ? '✅' : '⚠️'}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Importação Concluída!</h3>
              <p className="mt-2 text-muted">Registros importados: <strong className="text-green">{importResult.sucessos}</strong></p>
              <p className="text-muted">Registros com erro: <strong className="text-red">{importResult.erros.length}</strong></p>
            </div>
            
            {importResult.erros.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontWeight: 600, color: 'var(--accent-red)', marginBottom: 8 }}>Erros encontrados:</h4>
                <ul style={{ background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--accent-red)' }}>
                  {importResult.erros.map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>- Linha {e.linha}: {e.erro}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={onClose}>Fechar</button>
            </div>
          </div>
        ) : (
          <div className="animate-fade">
            <div className="form-group mb-4">
              <label className="label">O que você deseja importar?</label>
              <select className="input" value={tipo} onChange={e => { setTipo(e.target.value); setFile(null); setPreview([]); setLinhas([]); }}>
                <option value="despesas">Despesas Regulares</option>
                <option value="parcelamentos">Parcelamentos</option>
              </select>
            </div>

            <div className="flex gap-4 mb-6">
              <button className="btn btn-secondary flex-1" onClick={baixarTemplate} style={{ justifyContent: 'center' }}>
                <Download size={16} /> Baixar Modelo (.xlsx)
              </button>
            </div>

            <div style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: 30, textAlign: 'center', marginBottom: 20 }}>
              <input type="file" id="fileUpload" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Upload size={32} color="var(--accent-blue)" style={{ marginBottom: 10 }} />
                <span style={{ fontWeight: 600 }}>Clique aqui para selecionar seu arquivo</span>
                <span className="text-muted text-sm mt-1">.xlsx, .xls ou .csv (Máx: 5MB)</span>
              </label>
            </div>

            {errorMsg && (
              <div className="alert alert-danger mb-4" style={{ fontSize: 13 }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            {preview.length > 0 && (
              <div className="mb-4">
                <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Prévia dos Dados ({linhas.length} linhas detectadas):</h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        {getHeaders().map(h => <th key={h} style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          {getHeaders().map(h => <td key={h} style={{ padding: 8 }}>{String(row[h] || '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={onClose} disabled={isImporting}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={!file || isImporting || linhas.length === 0}>
                {isImporting ? <Loader2 size={16} className="spin" /> : `Importar ${linhas.length} registros`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
