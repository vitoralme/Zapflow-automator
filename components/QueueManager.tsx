import React, { useEffect, useState, useRef } from 'react';
import { Contact } from '../types';
import { Play, Pause, ExternalLink, Clock, CheckCircle2, SkipForward, AlertCircle, Link as LinkIcon, AlertTriangle, Coffee, ArrowRight, Settings, Trash2 } from 'lucide-react';

interface QueueManagerProps {
    contacts: Contact[];
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const BATCH_SIZE = 20;

const QueueManager: React.FC<QueueManagerProps> = ({ contacts, setContacts }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [nextRunTime, setNextRunTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [autoOpen, setAutoOpen] = useState(true);

    const [batchCount, setBatchCount] = useState(0);
    const [isLongPause, setIsLongPause] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings
    const [minDelaySec, setMinDelaySec] = useState(() => Number(localStorage.getItem('zapflow_min_delay')) || 120);
    const [maxDelaySec, setMaxDelaySec] = useState(() => Number(localStorage.getItem('zapflow_max_delay')) || 180);
    const [batchPauseMin, setBatchPauseMin] = useState(() => Number(localStorage.getItem('zapflow_batch_pause')) || 10);

    useEffect(() => {
        localStorage.setItem('zapflow_min_delay', minDelaySec.toString());
        localStorage.setItem('zapflow_max_delay', maxDelaySec.toString());
        localStorage.setItem('zapflow_batch_pause', batchPauseMin.toString());
    }, [minDelaySec, maxDelaySec, batchPauseMin]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stateRef = useRef({ autoOpen, activeIndex, contacts, isRunning, batchCount });

    useEffect(() => {
        stateRef.current = { autoOpen, activeIndex, contacts, isRunning, batchCount };
    }, [autoOpen, activeIndex, contacts, isRunning, batchCount]);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isRunning && nextRunTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, nextRunTime - now);
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    handleTimerComplete(stateRef.current);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, nextRunTime]);

    const getNextPendingIndex = () => {
        return contacts.findIndex(c => c.status === 'pending');
    };

    const getRandomDelay = () => {
        const min = Math.min(minDelaySec, maxDelaySec);
        const max = Math.max(minDelaySec, maxDelaySec);
        const seconds = Math.floor(Math.random() * (max - min + 1) + min);
        return seconds * 1000;
    };

    const startQueue = () => {
        const nextIdx = getNextPendingIndex();
        if (nextIdx === -1) {
            alert("Todos os contatos foram processados!");
            setIsRunning(false);
            return;
        }

        setActiveIndex(nextIdx);
        setIsRunning(true);
        setIsLongPause(false);
        setNextRunTime(Date.now() + 1000);
    };

    const pauseQueue = () => {
        setIsRunning(false);
        setNextRunTime(null);
    };

    const handleTimerComplete = (currentState: typeof stateRef.current) => {
        const { autoOpen: currentAutoOpen, activeIndex: currentActiveIndex } = currentState;

        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed interaction required"));
        }

        if (currentAutoOpen) {
            const success = openWhatsApp(currentActiveIndex, currentState.contacts);
            if (success) {
                completeContact(currentActiveIndex);
            } else {
                setIsRunning(false);
                setNextRunTime(null);
                alert("POP-UP BLOQUEADO! 🛑\n\nO navegador impediu a abertura do WhatsApp.\n\n1. Clique no ícone de 'Pop-up bloqueado' na barra de endereço.\n2. Selecione 'Sempre permitir'.\n3. Tente novamente.");
            }
        } else {
            setNextRunTime(null);
        }
    };

    const completeContact = (index: number) => {
        setContacts(prev => prev.map((c, i) => i === index ? { ...c, status: 'sent', lastActionTime: Date.now() } : c));

        const newBatchCount = batchCount + 1;
        setBatchCount(newBatchCount);

        const nextIdx = contacts.findIndex((c, i) => i > index && c.status === 'pending');

        if (nextIdx !== -1) {
            setActiveIndex(nextIdx);
            setIsRunning(true);

            if (newBatchCount >= BATCH_SIZE) {
                setNextRunTime(Date.now() + (batchPauseMin * 60 * 1000));
                setBatchCount(0);
                setIsLongPause(true);
            } else {
                setNextRunTime(Date.now() + getRandomDelay());
                setIsLongPause(false);
            }

        } else {
            setIsRunning(false);
            setNextRunTime(null);
            alert("Fila finalizada! Todos os links foram abertos.");
        }
    };

    const skipContact = (index: number) => {
        setContacts(prev => prev.map((c, i) => i === index ? { ...c, status: 'skipped' } : c));

        const nextIdx = contacts.findIndex((c, i) => i > index && c.status === 'pending');
        if (nextIdx !== -1) {
            setActiveIndex(nextIdx);
            if (isRunning) {
                setNextRunTime(Date.now() + 1000);
            }
        } else {
            setIsRunning(false);
            setNextRunTime(null);
        }
    };

    const removeContact = (index: number) => {
        const contactToRemove = contacts[index];
        if (!contactToRemove) return;

        if (window.confirm(`Tem certeza que deseja excluir o lead "${contactToRemove.name}"?`)) {
            setContacts(prev => prev.filter((_, i) => i !== index));

            // If we are removing the active index, reset it or move to the next
            if (index === activeIndex) {
                setNextRunTime(null);
                // Find the next pending contact in the remaining list
                const remainingContacts = contacts.filter((_, i) => i !== index);
                const nextIdx = remainingContacts.findIndex(c => c.status === 'pending');
                setActiveIndex(nextIdx);

                if (isRunning && nextIdx !== -1) {
                    setNextRunTime(Date.now() + 1000);
                } else if (nextIdx === -1) {
                    setIsRunning(false);
                }
            } else if (index < activeIndex) {
                // If we removed an item before the active one, adjust the active index
                setActiveIndex(prev => prev - 1);
            }
        }
    };

    const isLink = (str: string) => {
        return str.toLowerCase().startsWith('http') || str.toLowerCase().includes('wa.me');
    };

    const openWhatsApp = (index: number, currentContactsList = contacts): boolean => {
        const contact = currentContactsList[index];
        if (!contact) return false;

        let target = contact.phone;
        let url = '';

        if (isLink(target)) {
            url = target;
        } else {
            const phone = target.replace(/\D/g, '');
            const encodedMessage = encodeURIComponent(contact.customMessage || '');
            url = `https://wa.me/${phone}?text=${encodedMessage}`;
        }

        const win = window.open(url, '_blank');
        return win !== null;
    };

    const handleManualSend = () => {
        openWhatsApp(activeIndex);
        completeContact(activeIndex);
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / 1000 / 60));
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const pendingCount = contacts.filter(c => c.status === 'pending').length;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100">

            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1cb5c2]/10 rounded-lg">
                        <Clock className="text-[#1cb5c2]" size={24} />
                    </div>
                    <h2 className="text-xl font-display font-bold text-[#1A1A1A]">2. Gerenciador de Fila</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-[#1cb5c2] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title="Configurações de Intervalo"
                    >
                        <Settings size={20} />
                    </button>
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Modo Automático</span>
                        <button
                            onClick={() => setAutoOpen(!autoOpen)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${autoOpen ? 'bg-[#1cb5c2]' : 'bg-gray-300'}`}
                            title={autoOpen ? "Desativar modo automático" : "Ativar modo automático"}
                        >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${autoOpen ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {showSettings && (
                <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings size={14} /> Configurações de Intervalo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">ESPERA MÍNIMA (SEG)</label>
                            <input
                                type="number"
                                value={minDelaySec}
                                onChange={(e) => setMinDelaySec(Math.max(1, Number(e.target.value)))}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1cb5c2] focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">ESPERA MÁXIMA (SEG)</label>
                            <input
                                type="number"
                                value={maxDelaySec}
                                onChange={(e) => setMaxDelaySec(Math.max(1, Number(e.target.value)))}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1cb5c2] focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">PAUSA SEGURANÇA (MIN)</label>
                            <input
                                type="number"
                                value={batchPauseMin}
                                onChange={(e) => setBatchPauseMin(Math.max(1, Number(e.target.value)))}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1cb5c2] focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-medium">
                        * Os intervalos são aplicados após cada envio. A pausa de segurança ocorre a cada {BATCH_SIZE} mensagens.
                    </p>
                </div>
            )}

            {autoOpen && (
                <div className="mb-6 p-4 bg-[#1cb5c2]/10 border border-[#1cb5c2]/20 rounded-xl flex items-start gap-3 text-cyan-900 text-sm">
                    <AlertTriangle className="shrink-0 mt-0.5 text-[#1cb5c2]" size={18} />
                    <p className="font-medium">Pop-ups necessários. O sistema varia entre <span className="font-bold">{minDelaySec === maxDelaySec ? `${minDelaySec}s` : `${minDelaySec}s-${maxDelaySec}s`}</span> por mensagem e pausa <span className="font-bold">{batchPauseMin}min</span> a cada {BATCH_SIZE} envios.</p>
                </div>
            )}

            {/* Main Controls & Timer */}
            <div className="flex flex-col md:flex-row items-stretch gap-6 mb-10">
                <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between shadow-inner">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            {isLongPause ? 'PAUSA DE SEGURANÇA' : 'PRÓXIMO DISPARO'}
                        </p>
                        <div className={`text-4xl font-mono font-bold tracking-tight ${timeLeft < 5000 && isRunning ? 'text-red-500' :
                                isLongPause ? 'text-[#1cb5c2]' : 'text-[#1A1A1A]'
                            }`}>
                            {isRunning && nextRunTime ? formatTime(timeLeft) : '--:--'}
                        </div>
                        {isRunning && isLongPause && (
                            <p className="text-xs text-[#1cb5c2] font-medium mt-1 flex items-center gap-1">
                                <Coffee size={12} /> Pausa de {batchPauseMin} minutos
                            </p>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="mb-1">
                            <span className="text-sm text-gray-500 block">Pendentes</span>
                            <span className="text-2xl font-bold text-[#1A1A1A]">{pendingCount}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-3 min-w-[180px]">
                    {isRunning ? (
                        <button onClick={pauseQueue} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all">
                            <Pause size={20} fill="currentColor" /> Pausar
                        </button>
                    ) : (
                        <button onClick={startQueue} disabled={pendingCount === 0} className="flex-1 flex items-center justify-center gap-2 bg-[#1cb5c2] hover:bg-[#15939e] disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-cyan-200/50">
                            <Play size={20} fill="currentColor" /> Iniciar
                        </button>
                    )}
                    <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1 inline-flex items-center gap-1">
                            Lote Atual: <span className={`${batchCount >= BATCH_SIZE - 2 ? 'text-[#1cb5c2]' : 'text-[#1A1A1A]'}`}>{batchCount}</span>/<span className="text-gray-400">{BATCH_SIZE}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Item Card */}
            {activeIndex !== -1 && activeIndex < contacts.length && (
                <div className="mb-10 bg-white border border-[#1cb5c2]/30 rounded-2xl p-6 shadow-lg shadow-[#1cb5c2]/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#1cb5c2]"></div>

                    <div className="flex justify-between items-start mb-6 pl-2">
                        <div className="w-full">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-[#1cb5c2]/10 text-[#1cb5c2] text-xs font-bold px-2 py-0.5 rounded">EM PROCESSAMENTO</span>
                                {timeLeft === 0 && isRunning && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded animate-pulse">ABRINDO...</span>}
                            </div>
                            <h3 className="text-2xl font-display font-bold text-[#1A1A1A] mb-2 truncate">
                                {contacts[activeIndex].name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2.5 rounded-lg text-sm font-mono break-all border border-gray-100 max-w-lg">
                                <LinkIcon size={16} className="shrink-0 text-gray-400" />
                                {contacts[activeIndex].phone}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-4">
                            <button
                                onClick={() => skipContact(activeIndex)}
                                className="p-3 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-xl transition-colors"
                                title="Pular este contato"
                            >
                                <SkipForward size={22} />
                            </button>
                            <button
                                onClick={() => removeContact(activeIndex)}
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="Excluir este lead"
                            >
                                <Trash2 size={22} />
                            </button>
                        </div>
                    </div>

                    <div className="pl-2">
                        {(timeLeft === 0 && isRunning) || !isRunning ? (
                            <button
                                onClick={handleManualSend}
                                className="w-full bg-[#1cb5c2] hover:bg-[#15939e] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] shadow-md hover:shadow-lg"
                            >
                                <ExternalLink size={20} />
                                {contacts[activeIndex].status === 'sent' ? 'Reabrir Link' : 'Abrir Link Agora'}
                            </button>
                        ) : (
                            <div className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 border transition-colors ${isLongPause ? 'bg-[#1cb5c2]/5 text-[#15939e] border-[#1cb5c2]/20' : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                {isLongPause ? <Coffee size={20} /> : <Clock size={20} />}
                                {isLongPause
                                    ? `Pausa de Segurança (${formatTime(timeLeft)})`
                                    : `Aguardando Timer (${formatTime(timeLeft)})`
                                }
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* List */}
            <h3 className="font-display font-bold text-[#1A1A1A] mb-4 text-lg">Próximos na Fila</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {contacts.map((contact, idx) => {
                    const isActive = idx === activeIndex;
                    if (isActive) return null;

                    return (
                        <div key={contact.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${contact.status === 'sent' ? 'bg-gray-50 border-gray-100 opacity-60' :
                                contact.status === 'skipped' ? 'bg-gray-50 border-gray-100 opacity-40' :
                                    'bg-white border-gray-100 hover:border-[#1cb5c2]/50 hover:shadow-sm'
                            }`}>
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${contact.status === 'sent' ? 'bg-green-500' :
                                        contact.status === 'pending' ? 'bg-gray-300 group-hover:bg-[#1cb5c2]' : 'bg-red-400'
                                    }`} />
                                <div className="truncate">
                                    <p className={`font-semibold text-sm ${contact.status === 'sent' ? 'text-gray-500' : 'text-[#1A1A1A]'}`}>{contact.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{contact.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {contact.status === 'sent' && <CheckCircle2 size={18} className="text-green-500" />}
                                {contact.status === 'skipped' && <AlertCircle size={18} className="text-gray-400" />}
                                {contact.status === 'pending' && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeContact(idx);
                                            }}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remover lead"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default QueueManager;