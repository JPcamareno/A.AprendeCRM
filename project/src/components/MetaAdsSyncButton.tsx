import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

interface SyncResult {
  success: boolean;
  message?: string;
  result?: {
    campaignsSynced: number;
    recordsCreated: number;
    recordsUpdated: number;
    totalAmount: number;
    dateRange: {
      start: string;
      end: string;
    };
    errors: string[];
  };
}

interface MetaAdsSyncButtonProps {
  daysBack?: number;
  onSyncComplete?: () => void;
}

export function MetaAdsSyncButton({ daysBack = 7, onSyncComplete }: MetaAdsSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult['result'] | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      console.log(`🔄 Iniciando sincronización con Meta Ads (últimos ${daysBack} días)...`);

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('bright-task', {
        body: {
          daysBack: daysBack,
        },
      });

      if (error) {
        throw error;
      }

      const result = data as SyncResult;

      if (result.success && result.result) {
        setLastSync(new Date());
        setSyncResult(result.result);
        
        // Build toast message with safe checks
        const toastLines = ['✅ Sincronización exitosa'];
        
        if (result.result.campaignsSynced !== undefined) {
          toastLines.push(`📊 ${result.result.campaignsSynced} campañas sincronizadas`);
        }
        
        if (result.result.recordsCreated !== undefined && result.result.recordsUpdated !== undefined) {
          toastLines.push(`📝 ${result.result.recordsCreated} nuevos • ${result.result.recordsUpdated} actualizados`);
        }
        
        if (result.result.totalAmount !== undefined && result.result.totalAmount !== null) {
          toastLines.push(`💰 Total: ₡${result.result.totalAmount.toLocaleString('es-CR')}`);
        }
        
        toast.success(toastLines.join('\n'), { 
          duration: 6000,
          style: {
            minWidth: '350px',
          },
        });

        // Call callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }

        // Reload after a short delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || 'Error en la sincronización');
      }
    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      
      const errorMessage = error.message || 'Error desconocido';
      
      toast.error(
        `❌ Error en sincronización\n${errorMessage}`,
        { 
          duration: 8000,
          style: {
            minWidth: '350px',
          },
        }
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2"
        size="lg"
      >
        <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Sincronizando...' : 'Sincronizar desde Meta Ads'}
      </Button>

      {lastSync && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-green-50 p-2 rounded">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>
            Última sincronización: {lastSync.toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}

      {syncResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-blue-900">
                Resumen de sincronización
              </div>
              <div className="text-blue-700">
                {syncResult.campaignsSynced !== undefined && (
                  <div>• {syncResult.campaignsSynced} campañas</div>
                )}
                {syncResult.recordsCreated !== undefined && (
                  <div>• {syncResult.recordsCreated} registros nuevos</div>
                )}
                {syncResult.recordsUpdated !== undefined && (
                  <div>• {syncResult.recordsUpdated} registros actualizados</div>
                )}
                {syncResult.totalAmount !== undefined && syncResult.totalAmount !== null && (
                  <div className="font-semibold mt-1">
                    💰 Total: ₡{syncResult.totalAmount.toLocaleString('es-CR')}
                  </div>
                )}
              </div>
              {syncResult.dateRange && (
                <div className="text-blue-600 text-[10px] mt-1">
                  Período: {syncResult.dateRange.start} a {syncResult.dateRange.end}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!lastSync && !syncing && (
        <div className="text-xs text-gray-400 flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            💡 Sincroniza los gastos de los últimos {daysBack} días desde Meta Ads.
            Los datos se actualizan automáticamente en tiempo real.
          </div>
        </div>
      )}
    </div>
  );
}