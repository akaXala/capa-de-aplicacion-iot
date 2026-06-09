'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserButton } from '@clerk/nextjs';
import { 
  Radio, 
  Clock, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard, 
  Activity, 
  Play, 
  Square,
  ShieldAlert
} from 'lucide-react';

interface WorkerDashboardProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    email: string;
  };
}

interface LogEntry {
  id: number;
  uid: string;
  status: string;
  device_timestamp: string;
}

export default function WorkerDashboard({ user }: WorkerDashboardProps) {
  // Generar un UID por defecto basado en los últimos caracteres del User ID de Clerk
  const defaultUid = `RFID-${user.id.slice(-6).toUpperCase()}`;
  
  const [cardUid, setCardUid] = useState<string>(defaultUid);
  const [myLogs, setMyLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isForkliftActive, setIsForkliftActive] = useState<boolean>(false);

  const fetchMyLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('uid', cardUid)
        .order('device_timestamp', { ascending: false })
        .limit(8);

      if (error) throw error;
      setMyLogs((data as LogEntry[]) || []);
      
      // Determinar el último estado para ver si está encendido
      if (data && data.length > 0) {
        setIsForkliftActive(data[0].status === 'card_auth');
      }
    } catch (err: any) {
      console.error('Error al cargar logs del trabajador:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLogs();
  }, [cardUid]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSimulateAccess = async (status: 'card_auth' | 'operator_left') => {
    setActionLoading(status);
    try {
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from('access_logs')
        .insert([
          {
            uid: cardUid,
            status: status,
            device_timestamp: timestamp
          }
        ]);

      if (error) throw error;

      showFeedback(
        'success', 
        status === 'card_auth' 
          ? '¡Ignición autorizada simulada! Montacargas encendido.' 
          : '¡Salida del operador simulada! Montacargas apagado.'
      );
      
      setIsForkliftActive(status === 'card_auth');
      await fetchMyLogs();
    } catch (err: any) {
      showFeedback('error', 'Error al simular evento RFID: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateAlert = async () => {
    setActionLoading('alert');
    try {
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from('security_alerts')
        .insert([
          {
            alert_type: 'unauthorized_ignition',
            device_timestamp: timestamp,
            resolved: false
          }
        ]);

      if (error) throw error;

      showFeedback(
        'error', 
        '¡Alerta de seguridad disparada! Se ha insertado un intento de ignición violada sin RFID.'
      );
    } catch (err: any) {
      showFeedback('error', 'Error al disparar alerta de seguridad: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* Encabezado */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-blue-500 animate-pulse" />
            Portal del Trabajador IoT
          </h1>
          <p className="text-slate-400 mt-1">
            Simulador de telemetría RFID para operadores de bodega
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2 text-sm text-slate-300">
            <Activity className="h-4 w-4 text-blue-400" />
            Operador: <span className="font-bold text-white">{user.firstName} {user.lastName}</span>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Alerta de Feedback */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border text-sm transition-all duration-300 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
            : 'bg-red-950/30 border-red-500/30 text-red-200 animate-bounce'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Simulación */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Configuración RFID */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl" />
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Credencial RFID Asignada
            </h2>

            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  UID de Tarjeta RFID (Simulador)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Ej: RFID-8F9A"
                  />
                  <button
                    onClick={() => setCardUid(`RFID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
                  >
                    Generar Nuevo
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Esta tarjeta simula el chip RFID del operador que se pasa por el lector del montacargas.
                </p>
              </div>
            </div>
          </div>

          {/* Card de Controles del Montacargas */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Key className="h-5 w-5 text-blue-400" />
              Controles de Simulación de Cabina
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección Estado del Vehículo */}
              <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-5 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado del Montacargas</p>
                <div className="flex items-center gap-3">
                  <span className={`relative flex h-3 w-3 ${isForkliftActive ? 'block' : 'hidden'}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className={`relative flex h-3 w-3 ${!isForkliftActive ? 'block' : 'hidden'}`}>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className={`text-lg font-bold ${isForkliftActive ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {isForkliftActive ? 'ENCENDIDO / ACTIVO' : 'STANDBY / APAGADO'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  UID en el lector: <span className="font-mono text-slate-400">{isForkliftActive ? cardUid : 'Ninguno'}</span>
                </p>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex flex-col justify-center gap-3">
                <button
                  onClick={() => handleSimulateAccess('card_auth')}
                  disabled={actionLoading !== null || isForkliftActive}
                  className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isForkliftActive 
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-950/20 text-white border border-emerald-500/30'
                  }`}
                >
                  <Play className="h-4 w-4" />
                  {actionLoading === 'card_auth' ? 'Enviando...' : 'Pasar RFID (Encender)'}
                </button>

                <button
                  onClick={() => handleSimulateAccess('operator_left')}
                  disabled={actionLoading !== null || !isForkliftActive}
                  className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                    !isForkliftActive 
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-950/20 text-white border border-amber-500/30'
                  }`}
                >
                  <Square className="h-4 w-4" />
                  {actionLoading === 'operator_left' ? 'Enviando...' : 'Retirar RFID (Apagar)'}
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4" />
                Zona de Pruebas de Intrusión (Simulación de Hackeo)
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Este botón simula una violación del circuito de ignición física del vehículo sin haber pasado una tarjeta autorizada. Al hacer clic, se enviará una alerta crítica en tiempo real al panel del Administrador.
              </p>
              <button
                onClick={handleSimulateAlert}
                disabled={actionLoading !== null}
                className="w-full sm:w-auto py-2.5 px-5 bg-red-950/30 hover:bg-red-900/40 text-red-300 hover:text-red-200 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                {actionLoading === 'alert' ? 'Disparando...' : 'Disparar Alerta de Ignición Violada'}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Historial personal */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Mis Taps Recientes
          </h2>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-1">
            {myLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    log.status === 'card_auth' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {log.status === 'card_auth' ? 'Entrada (ON)' : 'Salida (OFF)'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{formatTime(log.device_timestamp)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  Tarjeta: {log.uid}
                </p>
              </div>
            ))}

            {myLogs.length === 0 && (
              <div className="h-full flex items-center justify-center text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-lg">
                <p className="text-xs">No hay eventos simulados con esta tarjeta.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
