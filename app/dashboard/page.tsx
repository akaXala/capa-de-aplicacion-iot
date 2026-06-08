'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, CheckCircle, ShieldCheck, Users, Radio, Clock } from 'lucide-react';

// ==========================================
// 1. DEFINICIÓN DE TIPOS E INTERFACES
// ==========================================
interface AccessLog {
  id: number;
  uid: string;
  status: string;
  device_timestamp: string;
  created_at?: string;
}

interface SecurityAlert {
  id: number;
  alert_type: string;
  device_timestamp: string;
  resolved: boolean;
  created_at?: string;
}

export default function DashboardForklift() {
  // Aplicando los tipos a los estados de React
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeOperators, setActiveOperators] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('access_logs')
        .select('*')
        .order('device_timestamp', { ascending: false })
        .limit(15);

      if (logsError) throw logsError;

      const { data: alerts, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .order('device_timestamp', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Casteamos los datos recibidos a nuestras interfaces
      const typedLogs = (logs as AccessLog[]) || [];
      const typedAlerts = (alerts as SecurityAlert[]) || [];

      setAccessLogs(typedLogs);
      setSecurityAlerts(typedAlerts);

      const operatorsMap: Record<string, boolean> = {};
      
      if (typedLogs.length > 0) {
        [...typedLogs].reverse().forEach((log) => {
          if (log.status === 'card_auth') {
            operatorsMap[log.uid] = true;
          } else if (log.status === 'operator_left') {
            delete operatorsMap[log.uid];
          }
        });
      }
      setActiveOperators(new Set(Object.keys(operatorsMap)));

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

  const marcarAlertaResuelta = async (id: number) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({ resolved: true })
      .eq('id', id);

    if (!error) {
      fetchData();
    }
  };

  const totalAlertasNoResueltas = securityAlerts.filter(a => !a.resolved).length;

  if (loading && accessLogs.length === 0) {
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
      
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-emerald-500 animate-ping" style={{ animationDuration: '3s' }} />
            Sistema de Monitoreo de Montacargas IoT
          </h1>
          <p className="text-slate-400 mt-1">Telemetría en tiempo real mediante arquitectura Edge-Broker-Cloud (mTLS & Mosquitto)</p>
        </div>
        <div className="mt-4 md:mt-0 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2 text-sm text-slate-300">
          <Clock className="h-4 w-4 text-emerald-400" />
          Actualización automática activa (Cada 3s)
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Unidades Activas</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{activeOperators.size}</h3>
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
            <p className="text-xs text-slate-500 mt-1">Intentos de ignición no autorizados</p>
          </div>
          <div className={`p-4 rounded-lg ${totalAlertasNoResueltas > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
            <ShieldAlert className="h-8 w-8" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Eventos en Caché</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{accessLogs.length}</h3>
            <p className="text-xs text-slate-500 mt-1">Mensajes MQTT decodificados recientes</p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg text-blue-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>

      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
                  <th className="py-3 px-4">UID Tarjeta</th>
                  <th className="py-3 px-4">Estado de Vehículo</th>
                  <th className="py-3 px-4">Hora del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {accessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">{log.uid}</td>
                    <td className="py-3 px-4">
                      {log.status === 'card_auth' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" /> Ignición Autorizada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Operador Ausente (Apagado)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatTime(log.device_timestamp)}</td>
                  </tr>
                ))}
                {accessLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">No se registran eventos de acceso aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Alertas Críticas de Seguridad
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-1">
            {securityAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border text-sm transition-all duration-300 ${
                  alert.resolved 
                    ? 'bg-slate-950 border-slate-800 opacity-60 text-slate-400' 
                    : 'bg-red-950/30 border-red-500/30 text-red-200 animate-shake'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold flex items-center gap-1.5 text-sm uppercase tracking-wide">
                      ⚠️ Intento de Ignición Violada
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Se detectó voltaje en la línea de ignición sin autorización RFID previa.
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(alert.device_timestamp)}
                    </p>
                  </div>
                  
                  {!alert.resolved && (
                    <button 
                      onClick={() => marcarAlertaResuelta(alert.id)}
                      className="px-2 py-1 text-xs font-semibold bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded border border-red-500/40 transition-all shadow-sm shrink-0"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {securityAlerts.length === 0 && (
              <div className="h-full flex items-center justify-center text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-lg">
                <div>
                  <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs">Perímetro e ignición seguros</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}