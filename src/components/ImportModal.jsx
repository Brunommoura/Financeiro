import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, X, AlertTriangle, Loader2 } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';
import { COLLECTIONS, ID, Permission, Role, Query } from '../lib/appwrite';
import { databases, DATABASE_ID } from '../lib/appwrite';

const parsearData = (valorData) => {
  if (!valorData) return null;

  if (valorData instanceof Date) {
    if (isNaN(valorData.getTime())) return null;
    return valorData;
  }

  if (typeof valorData === 'string' && valorData.includes('/')) {
    const partes = valorData.trim().split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1; 
      const ano = partes[2].length === 2
        ? parseInt('20' + partes[2])
        : parseInt(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);
      if (!isNaN(data.getTime())) return data;
    }
  }

  if (typeof valorData === 'string' && valorData.includes('-')) {
    const data = new Date(valorData + 'T12:00:00'); 
    if (!isNaN(data.getTime())) return data;
  }

  if (typeof valorData === 'number') {
    const data = XLSX.SSF.parse_date_code(valorData);
    if (data) {
      return new Date(data.y, data.m - 1, data.d, 12, 0, 0);
    }
  }

  return null;
};

const parsearValor = (valorBruto) => {
  if (valorBruto === null || valorBruto === undefined || valorBruto === '') return null;
  if (typeof valorBruto === 'number') return Math.abs(valorBruto);

  let str = String(valorBruto).trim().replace(/[R$\s]/g, '');
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }

  const numero = parseFloat(str);
  return isNaN(numero) ? null : Math.abs(numero);
};

const normalizarNome = (str) => {
  if (!str) return '';
  return String(str)
    .trim()                          
    .replace(/\s+/g, ' ')           
    .replace(/\u00A0/g, ' ')        
    .replace(/\u200B/g, '')         
    .normalize('NFD')               
    .replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase();
};

const toAppwriteDate = (dataObj) => {
  let d;

  if (dataObj instanceof Date) {
    d = dataObj;
  } else if (typeof dataObj === 'string') {
    if (dataObj.includes('/')) {
      const [dia, mes, ano] = dataObj.trim().split('/');
      const anoFull = ano.length === 2 ? '20' + ano : ano;
      d = new Date(parseInt(anoFull), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
    } else {
      d = new Date(dataObj);
    }
  } else if (typeof dataObj === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    d = new Date(excelEpoch.getTime() + dataObj * 86400000);
    d.setHours(12, 0, 0, 0);
  }

  if (!d || isNaN(d.getTime())) {
    throw new Error(`Data inválida: "${dataObj}"`);
  }

  return d.toISOString();
};

const encontrarCartao = (cartoes, nomeNaPlanilha) => {
  if (!nomeNaPlanilha || String(nomeNaPlanilha).trim() === '') return null;

  const nomePlanilhaNorm = normalizarNome(nomeNaPlanilha);

  let cartao = cartoes.find(c => normalizarNome(c.nome) === nomePlanilhaNorm);
  if (cartao) return cartao;

  cartao = cartoes.find(c =>
    normalizarNome(c.nome).includes(nomePlanilhaNorm) ||
    nomePlanilhaNorm.includes(normalizarNome(c.nome))
  );
  if (cartao) return cartao;

  console.warn(`⚠️ Cartão não encontrado: "${nomeNaPlanilha}"`);
  console.warn('Cartões disponíveis:', cartoes.map(c => `"${c.nome}"`).join(', '));

  return null;
};

const salvarDespesaSegura = async (dados, userId) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.DESPESAS,
      ID.unique(),
      dados,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );
  } catch (error) {
    if (
      error.message?.includes('dataVencimentoCartao') ||
      error.message?.includes('Unknown attribute')
    ) {
      console.warn('⚠️ Atributo dataVencimentoCartao não existe na collection — importando sem ele');
      const dadosSemVencimento = { ...dados };
      delete dadosSemVencimento.dataVencimentoCartao;

      return await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DESPESAS,
        ID.unique(),
        dadosSemVencimento,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );
    }
    throw error;
  }
};

export default function ImportModal({ isOpen, onClose, initialType = 'despesas', user, onImportSuccess, setDespesas, setParcelamentos }) {
  const [tipo, setTipo] = useState(initialType);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [linhasPreview, setLinhasPreview] = useState([]);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipo(initialType);
      setFile(null);
      setPreview([]);
      setLinhasPreview([]);
      setResultadoImportacao(null);
      setErrorMsg('');
      setImportando(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const baixarTemplate = () => {
    let dados;
    let nomeArquivo;

    if (tipo === 'despesas') {
      dados = [
        {
          'Data': '10/05/2026',
          'Descricao': 'Supermercado Extra',
          'Tipo': 'Variável',
          'Categoria': 'Alimentação',
          'Valor': 350.00,
          'FormaPagamento': 'Dinheiro',
          'Cartao': '',
          'Status': 'Pago',
          'Observacoes': 'Compra semanal'
        },
        {
          'Data': '05/05/2026',
          'Descricao': 'Aluguel',
          'Tipo': 'Fixa',
          'Categoria': 'Moradia',
          'Valor': 2000.00,
          'FormaPagamento': 'Transferência',
          'Cartao': '',
          'Status': 'Pago',
          'Observacoes': 'Maio/2026'
        }
      ];
      nomeArquivo = 'modelo_despesas.xlsx';
    } else { 
      dados = [
        {
          'Descricao': 'Notebook Dell',
          'ValorTotal': 3000.00,
          'NumeroParcelas': 12,
          'DataPrimeiraParcela': '10/01/2026',
          'Cartao': 'Nubank',
          'Categoria': 'Tecnologia',
          'Observacoes': 'Compra no Magazine Luiza'
        }
      ];
      nomeArquivo = 'modelo_parcelamentos.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(dados);
    const wscols = Object.keys(dados[0]).map(key => ({ wch: Math.max(key.length, 18) }));
    ws['!cols'] = wscols;

    const instrucoes = tipo === 'despesas'
      ? [
          { 'INSTRUÇÕES': '⚠️ Leia antes de preencher:' },
          { 'INSTRUÇÕES': '1. Não altere os nomes das colunas' },
          { 'INSTRUÇÕES': '2. Data: formato DD/MM/YYYY (ex: 05/05/2026)' },
          { 'INSTRUÇÕES': '3. Tipo: deve ser exatamente "Fixa", "Variável" ou "Parcelada"' },
          { 'INSTRUÇÕES': '4. Valor: use ponto como decimal (ex: 1500.90)' },
          { 'INSTRUÇÕES': '5. FormaPagamento: "Dinheiro", "Débito", "Cartão de Crédito", "Transferência" ou "PIX"' },
          { 'INSTRUÇÕES': '6. Cartao: preencha APENAS se FormaPagamento for "Cartão de Crédito"' },
          { 'INSTRUÇÕES': '7. Cartao: nome exato como cadastrado na aba Cartões do sistema' },
          { 'INSTRUÇÕES': '8. Status: "Pago" ou "Pendente"' },
          { 'INSTRUÇÕES': '9. Categoria: deve existir no sistema (ou será criada como nova)' },
          { 'INSTRUÇÕES': '10. Apague as linhas de exemplo e preencha com seus dados' },
        ]
      : [
          { 'INSTRUÇÕES': '⚠️ Leia antes de preencher:' },
          { 'INSTRUÇÕES': '1. Não altere os nomes das colunas' },
          { 'INSTRUÇÕES': '2. DataPrimeiraParcela: formato DD/MM/YYYY (ex: 10/01/2026)' },
          { 'INSTRUÇÕES': '3. ValorTotal: valor total da compra (ex: 3000.00)' },
          { 'INSTRUÇÕES': '4. NumeroParcelas: número inteiro entre 2 e 60' },
          { 'INSTRUÇÕES': '5. Cartao: nome EXATO como cadastrado na aba Cartões do sistema' },
          { 'INSTRUÇÕES': '6. Cartao: campo obrigatório para parcelamentos' },
          { 'INSTRUÇÕES': '7. O sistema gerará as parcelas automaticamente nas Despesas' },
          { 'INSTRUÇÕES': '8. Apague as linhas de exemplo e preencha com seus dados' },
        ];

    const wsInstrucoes = XLSX.utils.json_to_sheet(instrucoes);
    wsInstrucoes['!cols'] = [{ wch: 70 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instruções');

    XLSX.writeFile(wb, nomeArquivo);
  };

  const corrigirEncoding = (str) => {
    if (!str || typeof str !== 'string') return str;

    const mapaEncoding = {
      'Ã£': 'ã', 'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã¤': 'ä',
      'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
      'Ã': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
      'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
      'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
      'Ã§': 'ç', 'Ã±': 'ñ',
      'Ã': 'Á',  
      'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä',
      'Ã‰': 'É', 'ÃŠ': 'Ê', 'Ã‹': 'Ë',
      'ÃŒ': 'Ì', 'Ã': 'Í',  'ÃŽ': 'Î', 'Ã': 'Ï',
      'Ã\'': 'Ò', 'Ã"': 'Ó', 'Ã"': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö',
      'Ã™': 'Ù', 'Ãš': 'Ú', 'Ã›': 'Û', 'Ãœ': 'Ü',
      'Ã‡': 'Ç', 'Ã\'': 'Ñ',
      'â€œ': '"', 'â€': '"', 'â€™': "'", 'â€˜': "'",
      'â€"': '–', 'â€"': '—', 'â€¦': '…'
    };

    let resultado = str;
    Object.entries(mapaEncoding).forEach(([errado, correto]) => {
      resultado = resultado.split(errado).join(correto);
    });

    return resultado;
  };

  const lerArquivoExcel = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const extensao = fileObj.name.split('.').pop().toLowerCase();

      reader.onload = (e) => {
        try {
          let workbook;

          if (extensao === 'csv') {
            const textoUTF8 = new TextDecoder('utf-8').decode(
              new Uint8Array(e.target.result)
            );

            const pareceCorrompido = /Ã[§£¢¡¤¥¦¨©ª«¬®¯°]/.test(textoUTF8);

            const texto = pareceCorrompido
              ? new TextDecoder('iso-8859-1').decode(new Uint8Array(e.target.result))
              : textoUTF8;

            workbook = XLSX.read(texto, {
              type: 'string',
              cellDates: true,
              dateNF: 'dd/mm/yyyy'
            });

          } else {
            workbook = XLSX.read(new Uint8Array(e.target.result), {
              type: 'array',
              cellDates: true,
              dateNF: 'dd/mm/yyyy',
              codepage: 65001 
            });
          }

          const nomePrimeiraAba = workbook.SheetNames[0];
          const sheet = workbook.Sheets[nomePrimeiraAba];

          const json = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            dateNF: 'dd/mm/yyyy',
            defval: '' 
          });

          const jsonSanitizado = json.map(linha => {
            const linhaSanitizada = {};
            Object.keys(linha).forEach(chave => {
              const valor = linha[chave];
              const chaveLimpa = corrigirEncoding(String(chave));
              linhaSanitizada[chaveLimpa] = typeof valor === 'string'
                ? corrigirEncoding(valor)
                : valor;
            });
            return linhaSanitizada;
          });

          resolve(jsonSanitizado);

        } catch (err) {
          reject(new Error('Arquivo inválido ou corrompido: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));

      reader.readAsArrayBuffer(fileObj);
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
      const data = await lerArquivoExcel(selected);
      setLinhasPreview(data);
      setPreview(data.slice(0, 5));
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao ler o arquivo. Certifique-se de que é um formato válido.');
    }
  };

  const calcularDataVencimento = (dataCompra, diaVencimento) => {
    if (!diaVencimento) return null;
    const d = new Date(dataCompra);
    d.setMonth(d.getMonth() + 1);
    d.setDate(diaVencimento);
    return d;
  };

  const importarDespesasAppwrite = async (linhas, userId) => {
    const erros = [];
    const avisos = [];
    const sucessos = [];

    let cartoes = [];
    try {
      const resCartoes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CARTOES,
        [Query.equal('userId', userId), Query.limit(100)]
      );
      cartoes = resCartoes.documents;
      console.log('💳 Cartões carregados do Appwrite:', cartoes.map(c => `"${c.nome}"`).join(', '));
    } catch (err) {
      console.warn('Não foi possível buscar cartões:', err.message);
    }

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const numLinha = i + 2;

      try {
        const get = (chaves) => {
          for (const chave of chaves) {
            if (linha[chave] !== undefined && linha[chave] !== '') return linha[chave];
          }
          return null;
        };

        const descricaoRaw = get(['Descricao', 'Descrição', 'descricao', 'DESCRICAO']);
        const dataRaw      = get(['Data', 'data', 'DATA']);
        const valorRaw     = get(['Valor', 'valor', 'VALOR']);
        const tipoRaw      = get(['Tipo', 'tipo', 'TIPO']);
        const categoriaRaw = get(['Categoria', 'categoria', 'CATEGORIA']);
        const formaRaw     = get(['FormaPagamento', 'Forma de Pagamento', 'forma_pagamento', 'Forma Pagamento']);
        const cartaoRaw    = get(['Cartao', 'Cartão', 'cartao', 'CARTAO']);
        const statusRaw    = get(['Status', 'status', 'STATUS']);
        const obsRaw       = get(['Observacoes', 'Observações', 'observacoes', 'Obs']);

        if (!descricaoRaw) {
          erros.push({ linha: numLinha, erro: 'Coluna "Descricao" vazia ou ausente' });
          continue;
        }
        if (!dataRaw) {
          erros.push({ linha: numLinha, erro: 'Coluna "Data" vazia ou ausente' });
          continue;
        }
        if (valorRaw === null) {
          erros.push({ linha: numLinha, erro: 'Coluna "Valor" vazia ou ausente' });
          continue;
        }

        let dataObj = null;

        if (dataRaw instanceof Date) {
          dataObj = dataRaw;
        } else if (typeof dataRaw === 'string') {
          if (dataRaw.includes('/')) {
            const [d, m, a] = dataRaw.trim().split('/');
            const ano = a && a.length === 2 ? '20' + a : a;
            dataObj = new Date(parseInt(ano), parseInt(m) - 1, parseInt(d), 12, 0, 0);
          } else if (dataRaw.includes('-')) {
            dataObj = new Date(dataRaw + 'T12:00:00');
          }
        } else if (typeof dataRaw === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          dataObj = new Date(excelEpoch.getTime() + dataRaw * 86400000);
          dataObj.setHours(12, 0, 0, 0);
        }

        if (!dataObj || isNaN(dataObj.getTime())) {
          erros.push({ linha: numLinha, erro: `Data inválida: "${dataRaw}". Use o formato DD/MM/YYYY` });
          continue;
        }

        let valor = null;
        if (typeof valorRaw === 'number') {
          valor = Math.abs(valorRaw);
        } else if (typeof valorRaw === 'string') {
          const valorLimpo = valorRaw
            .replace(/R\$\s?/g, '')
            .replace(/\s/g, '')
            .replace(/\.(?=\d{3})/g, '')
            .replace(',', '.');
          valor = Math.abs(parseFloat(valorLimpo));
        }

        if (valor === null || isNaN(valor) || valor <= 0) {
          erros.push({ linha: numLinha, erro: `Valor inválido: "${valorRaw}"` });
          continue;
        }

        const tiposMap = {
          'fixa': 'Fixa', 'fixo': 'Fixa',
          'variavel': 'Variável', 'variável': 'Variável',
          'parcelada': 'Parcelada', 'parcelado': 'Parcelada'
        };
        const tipoNorm = tiposMap[(tipoRaw || '').toLowerCase()] || 'Variável';

        const statusNorm = ['pago', 'paga', 'paid'].includes((statusRaw || '').toLowerCase())
          ? 'Pago' : 'Pendente';

        let cartaoId = null;
        if (cartaoRaw && String(cartaoRaw).trim() !== '') {
          const cartaoEncontrado = encontrarCartao(cartoes, cartaoRaw);
          if (cartaoEncontrado) {
            cartaoId = cartaoEncontrado.$id;
          } else {
            avisos.push({
              linha: numLinha,
              aviso: `Cartão "${cartaoRaw}" não encontrado. Despesa importada sem cartão.`
            });
          }
        }

        let dataVencimentoCartao = null;
        if (cartaoId) {
          const cartaoObj = cartoes.find(c => c.$id === cartaoId);
          if (cartaoObj?.diaVencimento) {
            const diaVenc = cartaoObj.diaVencimento;
            const mesData = dataObj.getMonth();
            const anoData = dataObj.getFullYear();
            const diaData = dataObj.getDate();
            const venc = diaData <= diaVenc
              ? new Date(anoData, mesData, diaVenc, 12, 0, 0)
              : new Date(anoData, mesData + 1, diaVenc, 12, 0, 0);
            dataVencimentoCartao = venc.toISOString();
          }
        }

        const dadosDespesa = {
          userId,
          data: toAppwriteDate(dataRaw),
          descricao: String(descricaoRaw).trim(),
          tipo: tipoNorm,
          categoria: String(categoriaRaw || 'Outros').trim(),
          valor,
          status: statusNorm,
          origem: 'importacao',
          createdAt: new Date().toISOString()
        };

        if (formaRaw && String(formaRaw).trim()) {
          dadosDespesa.formaPagamento = String(formaRaw).trim();
        }
        if (cartaoId) {
          dadosDespesa.cartaoId = cartaoId;
        }
        if (dataVencimentoCartao) {
          dadosDespesa.dataVencimentoCartao = dataVencimentoCartao;
        }
        if (obsRaw && String(obsRaw).trim()) {
          dadosDespesa.observacoes = String(obsRaw).trim();
        }

        console.log(`📤 Importando linha ${numLinha}:`, dadosDespesa);

        await salvarDespesaSegura(dadosDespesa, userId);

        console.log(`✅ Linha ${numLinha} importada com sucesso`);
        sucessos.push({ linha: numLinha, descricao: String(descricaoRaw).trim() });

      } catch (error) {
        console.error(`❌ Erro na linha ${numLinha}:`, error);
        erros.push({ linha: numLinha, erro: `Erro ao salvar: ${error.message}` });
      }
    }

    console.log(`🏁 Importação concluída: ${sucessos.length} sucesso(s), ${erros.length} erro(s)`);

    return {
      total: linhas.length,
      importados: sucessos.length,
      erros,
      avisos
    };
  };

  const importarParcelamentosAppwrite = async (linhas, userId) => {
    const erros = [];
    const avisos = [];
    const sucessos = [];

    let cartoes = [];
    try {
      const resCartoes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CARTOES, [Query.equal('userId', userId)]);
      cartoes = resCartoes.documents;
      console.log('💳 Cartões carregados do Appwrite:', cartoes.map(c => `"${c.nome}"`).join(', '));
    } catch (err) {
      console.warn('Não foi possível buscar cartões:', err.message);
    }

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const numLinha = i + 2;

      try {
        const get = (chaves) => {
          for (const chave of chaves) {
            if (linha[chave] !== undefined && linha[chave] !== '') return linha[chave];
          }
          return null;
        };

        const descricao = get(['Descricao', 'Descrição', 'descricao']) || '';
        const valorTotalBruto = get(['ValorTotal', 'Valor Total', 'valor_total']) || 0;
        const numParcelasBruto = get(['NumeroParcelas', 'Numero de Parcelas', 'num_parcelas']) || 0;
        const dataBruta = get(['DataPrimeiraParcela', 'Data Primeira Parcela']) || '';
        const nomeCartao = get(['Cartao', 'Cartão']) || '';
        const categoria = get(['Categoria']) || 'Outros';
        const observacoes = get(['Observacoes', 'Observações']) || '';

        if (!descricao.trim()) {
          erros.push({ linha: numLinha, erro: 'Campo "Descricao" é obrigatório' });
          continue;
        }

        const valorTotal = parsearValor(valorTotalBruto);
        if (!valorTotal || valorTotal <= 0) {
          erros.push({ linha: numLinha, erro: `ValorTotal inválido: "${valorTotalBruto}"` });
          continue;
        }

        const numParcelas = parseInt(String(numParcelasBruto).replace(',', '.'));
        if (isNaN(numParcelas) || numParcelas < 2 || numParcelas > 60) {
          erros.push({ linha: numLinha, erro: `NumeroParcelas inválido: "${numParcelasBruto}". Deve ser entre 2 e 60` });
          continue;
        }

        const dataPrimeira = parsearData(dataBruta);
        if (!dataPrimeira) {
          erros.push({ linha: numLinha, erro: `DataPrimeiraParcela inválida: "${dataBruta}". Use DD/MM/YYYY` });
          continue;
        }

        let cartaoId = null;
        let cartaoObj = null;

        if (nomeCartao && nomeCartao.trim() !== '') {
          cartaoObj = encontrarCartao(cartoes, nomeCartao);
          if (cartaoObj) {
            cartaoId = cartaoObj.$id;
          } else {
            avisos.push({ linha: numLinha, aviso: `Cartão "${nomeCartao}" não encontrado. Parcelamento importado sem cartão vinculado.` });
          }
        }

        const valorParcela = parseFloat((valorTotal / numParcelas).toFixed(2));
        const valorUltimaParcela = parseFloat((valorTotal - valorParcela * (numParcelas - 1)).toFixed(2));

        const parcelamentoDados = {
          userId,
          descricao: String(descricao).trim(),
          valorTotal,
          numeroParcelas: numParcelas,
          valorParcela,
          dataPrimeiraParcela: toAppwriteDate(dataBruta),
          categoria: String(categoria).trim(),
          parcelasPagas: 0,
          status: 'Ativo',
          origem: 'importacao',
          createdAt: new Date().toISOString()
        };
        
        if (cartaoId) parcelamentoDados.cartaoId = cartaoId;
        if (observacoes && observacoes.trim()) parcelamentoDados.observacoes = String(observacoes).trim();

        const parcelamento = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PARCELAMENTOS,
          ID.unique(),
          parcelamentoDados,
          [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
        );

        for (let p = 0; p < numParcelas; p++) {
          const dataParcela = new Date(dataPrimeira);
          dataParcela.setMonth(dataParcela.getMonth() + p);
          if (dataParcela.getDate() !== dataPrimeira.getDate()) {
            dataParcela.setDate(0); 
          }

          let dataVencimentoCartao = null;
          if (cartaoObj && cartaoObj.diaVencimento) {
            const venc = calcularDataVencimento(dataParcela, cartaoObj.diaVencimento);
            dataVencimentoCartao = venc ? venc.toISOString() : null;
          }

          const valorEstaParcela = p === numParcelas - 1 ? valorUltimaParcela : valorParcela;

          const despesaParcelada = {
            userId,
            data: toAppwriteDate(dataParcela),
            descricao: `${String(descricao).trim()} - Parcela ${p + 1}/${numParcelas}`,
            tipo: 'Parcelada',
            categoria: String(categoria).trim(),
            valor: valorEstaParcela,
            parcelamentoId: parcelamento.$id,
            status: 'Pendente',
            origem: 'parcelamento',
            createdAt: new Date().toISOString()
          };

          if (cartaoId) {
            despesaParcelada.cartaoId = cartaoId;
            despesaParcelada.formaPagamento = 'Cartão de Crédito';
          }
          if (dataVencimentoCartao) despesaParcelada.dataVencimentoCartao = dataVencimentoCartao;

          await salvarDespesaSegura(despesaParcelada, userId);
        }

        sucessos.push({ linha: numLinha, descricao });
      } catch (error) {
        erros.push({ linha: numLinha, erro: `Erro inesperado: ${error.message}` });
      }
    }

    return { total: linhas.length, importados: sucessos.length, erros, avisos };
  };

  const recarregarDespesas = async () => {
    if (!setDespesas) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DESPESAS,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('data'),
          Query.limit(500)
        ]
      );
      setDespesas(response.documents);
    } catch (error) {
      console.error('Erro ao recarregar despesas:', error);
    }
  };

  const recarregarParcelamentos = async () => {
    if (!setParcelamentos) return;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PARCELAMENTOS,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('createdAt'),
          Query.limit(200)
        ]
      );
      setParcelamentos(response.documents);
    } catch (error) {
      console.error('Erro ao recarregar parcelamentos:', error);
    }
  };

  const handleConfirmarImportacao = async () => {
    if (!linhasPreview || linhasPreview.length === 0) {
      alert('Nenhum dado para importar.');
      return;
    }

    setImportando(true);

    try {
      let resultado;

      if (tipo === 'despesas') {
        resultado = await importarDespesasAppwrite(linhasPreview, user.$id);
      } else {
        resultado = await importarParcelamentosAppwrite(linhasPreview, user.$id);
      }

      setResultadoImportacao(resultado);

      if (tipo === 'despesas') {
        await recarregarDespesas();
      } else {
        await recarregarParcelamentos();
        await recarregarDespesas(); 
      }
      
      if (onImportSuccess) {
        onImportSuccess();
      }

    } catch (error) {
      console.error('Erro crítico na importação:', error);
      setResultadoImportacao({
        total: linhasPreview.length,
        importados: 0,
        erros: [{ linha: 0, erro: 'Erro crítico: ' + error.message }],
        avisos: []
      });
    } finally {
      setImportando(false);
      setLinhasPreview([]);
      setFile(null);
    }
  };

  const getHeaders = () => {
    if (preview.length === 0) return [];
    return Object.keys(preview[0]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Importar Planilha</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {resultadoImportacao ? (
          <div className="animate-fade">
            <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{resultadoImportacao.erros.length === 0 ? '✅' : '⚠️'}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Resultado da Importação</h3>
              <div className="grid-3 mt-4" style={{ gap: 10 }}>
                <div style={{ padding: 10, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 24, fontWeight: 800 }}>{resultadoImportacao.total}</p>
                  <p className="text-xs text-muted">Total de linhas</p>
                </div>
                <div style={{ padding: 10, background: 'rgba(16,185,129,0.1)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>{resultadoImportacao.importados}</p>
                  <p className="text-xs" style={{ color: 'var(--accent-green)' }}>Importados</p>
                </div>
                <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)' }}>{resultadoImportacao.erros.length}</p>
                  <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Erros</p>
                </div>
              </div>
            </div>
            
            {resultadoImportacao.avisos?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontWeight: 600, color: '#eab308', marginBottom: 8 }}>⚠️ AVISOS:</h4>
                <ul style={{ background: 'rgba(234, 179, 8, 0.1)', padding: 12, borderRadius: 8, fontSize: 13, color: '#ca8a04' }}>
                  {resultadoImportacao.avisos.map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>• Linha {e.linha}: {e.aviso}</li>
                  ))}
                </ul>
              </div>
            )}

            {resultadoImportacao.erros?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontWeight: 600, color: 'var(--accent-red)', marginBottom: 8 }}>❌ ERROS (Não importados):</h4>
                <ul style={{ background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--accent-red)' }}>
                  {resultadoImportacao.erros.map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>• Linha {e.linha}: {e.erro}</li>
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
              <select className="input" value={tipo} onChange={e => { setTipo(e.target.value); setFile(null); setPreview([]); setLinhasPreview([]); }}>
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
              <div className="alert alert-danger mb-4" style={{ fontSize: 13, padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            {preview.length > 0 && (
              <div className="mb-4">
                <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Prévia dos Dados ({linhasPreview.length} linhas detectadas):</h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
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
              <button className="btn btn-ghost" onClick={onClose} disabled={importando}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmarImportacao} 
                disabled={importando || linhasPreview.length === 0}
              >
                {importando ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="spin" /> Importando... aguarde
                  </span>
                ) : (
                  `⬆ Importar ${linhasPreview.length} registro(s)`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
