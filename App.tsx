import React, { useState } from 'react';
import { Contact } from './types';
import DataInput from './components/DataInput';
import QueueManager from './components/QueueManager';
import { Zap, LayoutTemplate } from 'lucide-react';

const App: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);

    const handleImport = (newContacts: Contact[]) => {
        setContacts(newContacts);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#1cb5c2]/10 p-2 rounded-lg">
                            <Zap className="text-[#1cb5c2]" size={24} fill="#1cb5c2" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-[#1A1A1A] tracking-tight leading-none">ZapFlow</h1>
                            <p className="text-xs text-gray-500 font-medium">Automação Inteligente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Sistema Online
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {/* Intro / Instructions */}
                {contacts.length === 0 && (
                    <div className="text-center mb-16 py-8">
                        <h2 className="text-4xl font-display font-bold text-[#1A1A1A] mb-4 tracking-tight">
                            Automatize seus envios do WhatsApp
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                            Importe sua planilha e deixe nosso sistema gerenciar a fila de envios com intervalos inteligentes para evitar bloqueios.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                <span className="bg-[#1cb5c2]/10 text-[#1cb5c2] font-bold text-sm px-3 py-1 rounded-full mb-3 inline-block">Passo 01</span>
                                <h3 className="font-display font-bold text-lg text-[#1A1A1A] mb-2">Importar Planilha</h3>
                                <p className="text-sm text-gray-500">Carregue seu arquivo .xlsx ou .csv com a coluna de links do WhatsApp.</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                <span className="bg-[#1cb5c2]/10 text-[#1cb5c2] font-bold text-sm px-3 py-1 rounded-full mb-3 inline-block">Passo 02</span>
                                <h3 className="font-display font-bold text-lg text-[#1A1A1A] mb-2">Configurar Fila</h3>
                                <p className="text-sm text-gray-500">O sistema define pausas seguras e personalizáveis para evitar bloqueios.</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                <span className="bg-[#1cb5c2]/10 text-[#1cb5c2] font-bold text-sm px-3 py-1 rounded-full mb-3 inline-block">Passo 03</span>
                                <h3 className="font-display font-bold text-lg text-[#1A1A1A] mb-2">Disparo Automático</h3>
                                <p className="text-sm text-gray-500">Os links abrem sozinhos. Você só precisa confirmar o envio no App.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Components */}
                <div className="space-y-8">
                    <DataInput onImport={handleImport} />

                    {contacts.length > 0 && (
                        <QueueManager contacts={contacts} setContacts={setContacts} />
                    )}
                </div>
            </main>

            <footer className="border-t border-gray-200 mt-20 py-8 text-center text-sm text-gray-500 bg-white">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="font-medium">&copy; {new Date().getFullYear()} ZapFlow Automator.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[#1cb5c2] transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-[#1cb5c2] transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-[#1cb5c2] transition-colors">Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;