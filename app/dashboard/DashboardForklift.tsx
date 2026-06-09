'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldAlert, 
  CheckCircle, 
  ShieldCheck, 
  Users, 
  Radio, 
  Clock, 
  Lock, 
  Unlock,
  UserCheck, 
  AlertTriangle,
  UserPlus,
  Trash2,
  Activity
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

// ==========================================
// 1. DEFINICIÓN DE TIPOS E INTERFACES
// ==========================================
interface OperatorInfo {
  name: string;
  photo_url: string;
  rfid_uid?: string;
}

interface ForkliftInfo {
  name: string;
  blocked: boolean;
}

interface AccessLog {
  id: number;
  uid: string;
  status: string;
  device_timestamp: string;
  forklift_id: string;
  forklifts?: ForkliftInfo;
  operators?: OperatorInfo;
}

interface SecurityAlert {
  id: number;
  alert_type: string;
  device_timestamp: string;
  resolved: boolean;
  forklift_id: string;
  forklifts?: ForkliftInfo;
}

interface ForkliftRecord {
  id: string;
  name: string;
  blocked: boolean;
}

export default function DashboardForklift() {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [forkliftsList, setForkliftsList] = useState<ForkliftRecord[]>([]);
  const [operatorsList, setOperatorsList] = useState<OperatorInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeTick, setTimeTick] = useState<number>(0);

  // Estados del Formulario de Operadores
  const [newOperatorName, setNewOperatorName] = useState<string>('');
  const [newOperatorRfid, setNewOperatorRfid] = useState<string>('');
  const [newOperatorPhoto, setNewOperatorPhoto] = useState<string>('');
  const [operatorActionLoading, setOperatorActionLoading] = useState<boolean>(false);
  const [operatorMessage, setOperatorMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Intervalo para actualizar los contadores de tiempo en pantalla cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setOperatorsList(data || []);
    } catch (err: any) {
      console.error('Error al cargar operadores:', err.message);
    }
  };

  const fetchData = async () => {
    try {
      // 1. Cargar lista de montacargas
      const { data: forklifts, error: forkliftsError } = await supabase
        .from('forklifts')
        .select('*')
        .order('id', { ascending: true });

      if (forkliftsError) throw forkliftsError;
      setForkliftsList(forklifts || []);

      // 2. Cargar operadores
      await fetchOperators();

      // 3. Cargar logs de acceso con Joins de operadores y montacargas
      const { data: logs, error: logsError } = await supabase
        .from('access_logs')
        .select(`
          id,
          uid,
          status,
          device_timestamp,
          forklift_id,
          forklifts ( name, blocked ),
          operators ( name, photo_url )
        `)
        .order('device_timestamp', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setAccessLogs((logs as any[]) || []);

      // 4. Cargar alertas de seguridad con Joins de montacargas
      const { data: alerts, error: alertsError } = await supabase
        .from('security_alerts')
        .select(`
          id,
          alert_type,
          device_timestamp,
          resolved,
          forklift_id,
          forklifts ( name, blocked )
        `)
        .order('device_timestamp', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;
      setSecurityAlerts((alerts as any[]) || []);

    } catch (error: any) {
      console.error('Error recuperando datos de Supabase:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const calculateElapsedTime = (timestamp: string): string => {
    if (!timestamp) return '';
    const start = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const diffMs = now - start;
    if (diffMs < 0) return '0s';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins % 60}m`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  };

  const ignorarAlerta = async (id: number) => {
    const { error } = await supabase
      .from('security_alerts')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  // Función para Bloquear/Desbloquear Montacargas (Un Solo Botón)
  const handleToggleBlockForklift = async (id: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('forklifts')
        .update({ blocked: !currentBlocked })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert('Error al actualizar bloqueo de montacargas: ' + err.message);
    }
  };

  // Registro de operador en Supabase
  const handleRegisterOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperatorName || !newOperatorRfid) {
      setOperatorMessage({ type: 'error', text: 'Nombre y RFID UID son obligatorios.' });
      return;
    }

    setOperatorActionLoading(true);
    setOperatorMessage(null);

    try {
      const { error } = await supabase
        .from('operators')
        .insert([
          {
            rfid_uid: newOperatorRfid.trim().toUpperCase(),
            name: newOperatorName.trim(),
            photo_url: newOperatorPhoto.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
          }
        ]);

      if (error) throw error;

      setOperatorMessage({ type: 'success', text: `¡Operador ${newOperatorName} registrado con éxito!` });
      setNewOperatorName('');
      setNewOperatorRfid('');
      setNewOperatorPhoto('');
      await fetchOperators();
    } catch (err: any) {
      setOperatorMessage({ type: 'error', text: 'Error al registrar operador: ' + err.message });
    } finally {
      setOperatorActionLoading(false);
      setTimeout(() => setOperatorMessage(null), 5000);
    }
  };

  // Eliminar operador de Supabase
  const handleDeleteOperator = async (rfidUid: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al operador ${name}? Esto denegará cualquier intento de ignición con su tarjeta RFID.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('rfid_uid', rfidUid);

      if (error) throw error;
      await fetchOperators();
    } catch (err: any) {
      alert('Error al eliminar operador: ' + err.message);
    }
  };

  // Reconstruir los montacargas activos escaneando logs cronológicamente
  const forkliftStatusMap: Record<string, {
    status: string;
    uid: string;
    operatorName: string;
    operatorPhoto: string;
    device_timestamp: string;
  }> = {};

  // Procesamos en orden de más antiguo a más nuevo
  [...accessLogs].reverse().forEach(log => {
    if (!log.forklift_id) return;
    
    const op = Array.isArray(log.operators) ? log.operators[0] : log.operators;
    const opName = op?.name || 'Operador Genérico';
    const opPhoto = op?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
    
    if (log.status === 'card_auth') {
      forkliftStatusMap[log.forklift_id] = {
        status: 'card_auth',
        uid: log.uid,
        operatorName: opName,
        operatorPhoto: opPhoto,
        device_timestamp: log.device_timestamp
      };
    } else if (log.status === 'operator_left') {
      if (forkliftStatusMap[log.forklift_id]?.uid === log.uid) {
        delete forkliftStatusMap[log.forklift_id];
      }
    }
  });

  const totalAlertasNoResueltas = securityAlerts.length;
  const activeCount = Object.keys(forkliftStatusMap).length;

  if (loading && forkliftsList.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <Radio className="mx-auto h-12 w-12 animate-pulse text-yellow-500 mb-4" />
          <p className="text-lg font-semibold">Conectando con el Pipeline de Datos de Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* Encabezado */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-emerald-500 animate-ping" style={{ animationDuration: '3s' }} />
            Sistema de Monitoreo de Montacargas IoT (Admin)
          </h1>
          <p className="text-slate-400 mt-1">Telemetría en tiempo real mediante arquitectura Edge-Broker-Cloud (mTLS & Mosquitto)</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4 text-emerald-400" />
            Actualización activa
          </div>
          <UserButton />
        </div>
      </header>

      {/* Contadores Estadísticos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Unidades Activas</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{activeCount}</h3>
            <p className="text-xs text-slate-500 mt-1">Montacargas operando en bodega</p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Users className="h-8 w-8" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border shadow-lg flex items-center justify-between transition-colors duration-300 ${
          totalAlertasNoResueltas > 0 
            ? 'bg-red-950/40 border-red-900/50 text-red-200' 
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Alertas Sin Resolver</p>
            <h3 className={`text-3xl font-bold mt-2 ${totalAlertasNoResueltas > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {totalAlertasNoResueltas}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Infracciones y encendidos prohibidos</p>
          </div>
          <div className={`p-4 rounded-lg ${totalAlertasNoResueltas > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
            <ShieldAlert className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Flota Registrada</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{forkliftsList.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Vehículos dados de alta en sistema</p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg text-blue-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>

      </section>

      {/* Supervisión de Flota en Tiempo Real */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-400" />
          Monitoreo de Flota Activa
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forkliftsList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-slate-300">No se detectaron montacargas en la base de datos.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Por favor, inicia el simulador de IoT ejecutando <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-emerald-400">node index.js</code> para poblar automáticamente los montacargas de prueba en Supabase.
              </p>
            </div>
          ) : (
            forkliftsList.map((forklift) => {
              const activeSession = forkliftStatusMap[forklift.id];
              
              return (
                <div 
                  key={forklift.id} 
                  className={`rounded-xl border p-5 shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    forklift.blocked
                      ? 'bg-red-950/20 border-red-900/50'
                      : activeSession
                        ? 'bg-slate-900 border-emerald-500/30'
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-white text-base">{forklift.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{forklift.id}</p>
                      </div>
                      
                      {forklift.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                          <Lock className="h-3 w-3" /> Bloqueado
                        </span>
                      ) : activeSession ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En Uso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Standby
                        </span>
                      )}
                    </div>

                    {forklift.blocked ? (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <Lock className="h-10 w-10 text-red-500 mb-2 opacity-80" />
                        <p className="text-xs text-red-300 font-medium">Vehículo en Lista Negra</p>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Ignición desactivada por seguridad del almacén.</p>
                      </div>
                    ) : activeSession ? (
                      <div className="flex items-center gap-4 py-2">
                        <img 
                          src={activeSession.operatorPhoto} 
                          alt={activeSession.operatorName} 
                          className="h-12 w-12 rounded-full border border-emerald-500/50 object-cover shadow-md"
                        />
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operador</p>
                          <p className="text-sm font-bold text-white leading-snug">{activeSession.operatorName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Tiempo: {calculateElapsedTime(activeSession.device_timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center text-slate-500">
                        <CheckCircle className="h-8 w-8 text-slate-700 mb-2" />
                        <p className="text-xs font-semibold text-slate-400">Disponible para Operar</p>
                        <p className="text-[10px] text-slate-600 mt-1">Requiere credencial RFID registrada.</p>
                      </div>
                    )}
                  </div>

                  {/* BOTÓN DE BLOQUEO/DESBLOQUEO DE UN SOLO CLIC */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60">
                    <button
                      onClick={() => handleToggleBlockForklift(forklift.id, forklift.blocked)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        forklift.blocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-950/20'
                          : 'bg-red-950/40 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-500/20'
                      }`}
                    >
                      {forklift.blocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          Desbloquear Acceso
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Bloquear Acceso
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Control de Usuarios / Registro de Operadores */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario de Registro */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            Registrar Trabajador
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Da de alta una nueva credencial RFID y vincula al empleado correspondiente en la base de datos de control.
          </p>

          {operatorMessage && (
            <div className={`mb-4 p-3 rounded-lg border text-xs text-center ${
              operatorMessage.type === 'success' 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-950/20 border-red-500/30 text-red-400'
            }`}>
              {operatorMessage.text}
            </div>
          )}

          <form onSubmit={handleRegisterOperator} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={newOperatorName}
                onChange={(e) => setNewOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Ej. Carlos Mendoza"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                RFID UID (Hexadecimal de tarjeta)
              </label>
              <input
                type="text"
                required
                value={newOperatorRfid}
                onChange={(e) => setNewOperatorRfid(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Ej. AA11BB22"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                URL de Foto de Perfil (Opcional)
              </label>
              <input
                type="text"
                value={newOperatorPhoto}
                onChange={(e) => setNewOperatorPhoto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Ej. https://url-de-imagen.com/foto.jpg"
              />
            </div>

            <button
              type="submit"
              disabled={operatorActionLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 rounded-lg text-sm font-bold shadow-md hover:shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
            >
              {operatorActionLoading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Agregar a Base de Datos
                </>
              )}
            </button>
          </form>
        </div>

        {/* Listado de Operadores */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Operadores Habilitados
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Lista de credenciales autorizadas físicamente para encender los vehículos.
          </p>

          <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-800/60 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Operador</th>
                  <th className="py-2.5 px-4">RFID UID</th>
                  <th className="py-2.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {operatorsList.map((operator: any) => (
                  <tr key={operator.rfid_uid} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-4 flex items-center gap-3">
                      <img 
                        src={operator.photo_url} 
                        alt={operator.name} 
                        className="h-8 w-8 rounded-full border border-slate-800 object-cover"
                      />
                      <span className="font-semibold text-slate-200">{operator.name}</span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-400">{operator.rfid_uid}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleDeleteOperator(operator.rfid_uid, operator.name)}
                        className="p-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded border border-red-500/10 hover:border-red-500/20 transition-all"
                        title="Eliminar de la Base de Datos"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {operatorsList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">No hay operadores habilitados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* Grid de logs e historiales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabla de Logs RFID */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Historial de Control de Acceso (RFID)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm font-medium">
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Montacargas</th>
                  <th className="py-3 px-4">Estado del Vehículo</th>
                  <th className="py-3 px-4">Hora del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {accessLogs.map((log) => {
                  const op = Array.isArray(log.operators) ? log.operators[0] : log.operators;
                  const f = Array.isArray(log.forklifts) ? log.forklifts[0] : log.forklifts;
                  
                  const opName = op?.name || 'Operador Genérico';
                  const opPhoto = op?.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
                  const fName = f?.name || log.forklift_id || 'Desconocido';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img 
                          src={opPhoto} 
                          alt={opName} 
                          className="h-7 w-7 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-200">{opName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{log.uid}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{fName}</td>
                      <td className="py-3 px-4">
                        {log.status === 'card_auth' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ignición Autorizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Operador Ausente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{formatTime(log.device_timestamp)}</td>
                    </tr>
                  );
                })}
                {accessLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">No se registran eventos de acceso aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Alertas Críticas */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Alertas Críticas de Seguridad
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {securityAlerts.map((alert) => {
              const f = Array.isArray(alert.forklifts) ? alert.forklifts[0] : alert.forklifts;
              const fName = f?.name || alert.forklift_id || 'Montacargas Desconocido';
              const isBlacklistAttempt = alert.alert_type === 'blocked_forklift_ignition_attempt';

              return (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border text-sm transition-all duration-300 ${
                    isBlacklistAttempt
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-red-950/30 border-red-500/30 text-red-200 animate-pulse'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold flex items-center gap-1.5 text-sm uppercase tracking-wide">
                        {isBlacklistAttempt ? '⚠️ Intento en Lista Negra' : '🚨 Ignición Violada'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {isBlacklistAttempt 
                          ? `Un operador intentó encender el vehículo bloqueado: ${fName}.`
                          : `Voltaje detectado en ignición de ${fName} sin autorización RFID.`}
                      </p>
                      <p className="text-xs font-mono text-slate-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(alert.device_timestamp)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => ignorarAlerta(alert.id)}
                      className={`px-2 py-1 text-xs font-semibold rounded border transition-all shadow-sm shrink-0 ${
                        isBlacklistAttempt
                          ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border-amber-500/40'
                          : 'bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border-red-500/40'
                      }`}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              );
            })}
            
            {securityAlerts.length === 0 && (
              <div className="h-full flex items-center justify-center text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-lg">
                <div>
                  <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs">Bodega y flota seguras</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
