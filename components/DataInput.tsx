import React, { useState, useRef } from 'react';
import { Contact } from '../types';
import { FileText, Download, Link as LinkIcon, Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface DataInputProps {
  onImport: (contacts: Contact[]) => void;
}

const DataInput: React.FC<DataInputProps> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processData = (data: any[][]) => {
    const parsedContacts: Contact[] = [];
    
    let linkColIndex = -1;
    let nameColIndex = -1;

    const maxScanRows = Math.min(data.length, 10);
    
    for (let r = 0; r < maxScanRows; r++) {
        const row = data[r];
        if (!Array.isArray(row)) continue;

        for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').toLowerCase();
            if (cell.includes('http') || cell.includes('wa.me')) {
                linkColIndex = c;
                break;
            }
        }
        if (linkColIndex !== -1) break;
    }

    if (linkColIndex === -1) {
        alert("Não encontramos nenhuma coluna com links (http ou wa.me) na sua planilha.");
        setIsLoading(false);
        setFileName(null);
        return;
    }

    for (let r = 0; r < maxScanRows; r++) {
       const row = data[r];
       if (!Array.isArray(row)) continue;
       for (let c = 0; c < row.length; c++) {
           if (c !== linkColIndex && String(row[c]).length > 2) {
               nameColIndex = c;
               break;
           }
       }
       if (nameColIndex !== -1) break;
    }

    data.forEach((row, index) => {
        if (!Array.isArray(row)) return;

        const rawLink = String(row[linkColIndex] || '').trim();
        
        if (rawLink.length > 5 && (rawLink.toLowerCase().includes('http') || rawLink.toLowerCase().includes('wa.me'))) {
            let name = `Contato ${index + 1}`;
            if (nameColIndex !== -1 && row[nameColIndex]) {
                name = String(row[nameColIndex]).trim();
            }

            parsedContacts.push({
                id: generateId(),
                name: name,
                phone: rawLink,
                customMessage: '', 
                status: 'pending'
            });
        }
    });

    if (parsedContacts.length > 0) {
        onImport(parsedContacts);
    } else {
        alert("Nenhum link válido encontrado nas linhas processadas.");
        setFileName(null);
    }
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            processData(data);
        } catch (error) {
            console.error("Error parsing excel", error);
            alert("Erro ao ler o arquivo Excel.");
            setIsLoading(false);
            setFileName(null);
        }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#1cb5c2]/10 rounded-lg">
            <FileSpreadsheet className="text-[#1cb5c2]" size={24} />
        </div>
        <h2 className="text-xl font-display font-bold text-[#1A1A1A]">1. Importar Dados</h2>
      </div>
      
      <p className="text-gray-500 text-sm mb-6 ml-11">
        Carregue seu arquivo <strong>.xlsx</strong> ou <strong>.csv</strong>. O sistema detectará automaticamente a coluna de links.
      </p>

      {!fileName ? (
        <div 
            className={`group border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDragging 
                ? 'border-[#1cb5c2] bg-[#1cb5c2]/10' 
                : 'border-gray-200 hover:border-[#1cb5c2] hover:bg-[#1cb5c2]/5'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-[#1cb5c2] group-hover:scale-110 transition-transform">
                <Upload size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-display font-semibold text-[#1A1A1A] mb-2">Clique ou arraste o arquivo aqui</h3>
            <p className="text-sm text-gray-400">Suporta arquivos Excel e CSV</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm text-green-600">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <p className="text-[#1A1A1A] font-semibold">{fileName}</p>
                    <p className="text-xs text-gray-500 font-medium">{isLoading ? 'Processando dados...' : 'Pronto para iniciar'}</p>
                </div>
            </div>
            <button 
                onClick={() => { setFileName(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      )}
    </div>
  );
};

export default DataInput;