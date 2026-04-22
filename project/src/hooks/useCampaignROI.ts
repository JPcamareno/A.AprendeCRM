import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface CampaignROI {
  campaign_name: string;
  semanas_activas: number;
  gastos: number;
  ingresos: number;
  num_ventas: number;
  ganancia: number;
  roi_porcentaje: number | null;
}

// Nuevo: Interfaz para anuncios
export interface AdROI {
  ad_name: string;
  gastos: number;
  ingresos: number;
  num_ventas: number;
  ganancia: number;
  roi_porcentaje: number | null;
}

// Nuevo: Interfaz para campaña con anuncios
export interface CampaignWithAds extends CampaignROI {
  ads: AdROI[];
}

export function useCampaignROI() {
  const [campaignsROI, setCampaignsROI] = useState<CampaignROI[]>([]);
  const [campaignsWithAds, setCampaignsWithAds] = useState<CampaignWithAds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const roiResult = await fetchCampaignROIManual();
      const roiWithAds = await fetchCampaignWithAds();
      setCampaignsROI(roiResult);
      setCampaignsWithAds(roiWithAds);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Error al cargar resumen');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignROIManual = async (): Promise<CampaignROI[]> => {
    const { data: expenses } = await supabase
      .from('advertising_expenses')
      .select('campaign_name, week_number, day_1, day_2, day_3, day_4, day_5, day_6, day_7')
      .eq('year', 2025);

    const { data: sales } = await supabase
      .from('sales')
      .select('campaign_name, amount');

    const gastosPorCampana = (expenses || []).reduce((acc, exp) => {
      const total = Number(exp.day_1) + Number(exp.day_2) + Number(exp.day_3) + 
                    Number(exp.day_4) + Number(exp.day_5) + Number(exp.day_6) + Number(exp.day_7);
      if (!acc[exp.campaign_name]) {
        acc[exp.campaign_name] = { total: 0, semanas: new Set() };
      }
      acc[exp.campaign_name].total += total;
      acc[exp.campaign_name].semanas.add(exp.week_number);
      return acc;
    }, {} as Record<string, { total: number; semanas: Set<number> }>);

    const ventasPorCampana = (sales || []).reduce((acc, sale) => {
      if (!sale.campaign_name) return acc;
      if (!acc[sale.campaign_name]) {
        acc[sale.campaign_name] = { total: 0, count: 0 };
      }
      acc[sale.campaign_name].total += Number(sale.amount);
      acc[sale.campaign_name].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const allCampaigns = new Set([
      ...Object.keys(gastosPorCampana),
      ...Object.keys(ventasPorCampana)
    ]);

    const result: CampaignROI[] = Array.from(allCampaigns).map(campaign => {
      const gastos = gastosPorCampana[campaign]?.total || 0;
      const ingresos = ventasPorCampana[campaign]?.total || 0;
      const num_ventas = ventasPorCampana[campaign]?.count || 0;
      const semanas_activas = gastosPorCampana[campaign]?.semanas.size || 0;
      const ganancia = ingresos - gastos;
      const roi_porcentaje = gastos > 0 ? ((ganancia / gastos) * 100) : null;

      return {
        campaign_name: campaign,
        semanas_activas,
        gastos,
        ingresos,
        num_ventas,
        ganancia,
        roi_porcentaje,
      };
    });

    return result.sort((a, b) => b.ganancia - a.ganancia);
  };

  // NUEVA FUNCIÓN: Obtener campañas con sus anuncios
  const fetchCampaignWithAds = async (): Promise<CampaignWithAds[]> => {
    const { data: expenses } = await supabase
      .from('advertising_expenses')
      .select('campaign_name, week_number, day_1, day_2, day_3, day_4, day_5, day_6, day_7')
      .eq('year', 2025);

    const { data: sales } = await supabase
      .from('sales')
      .select('campaign_name, image_video_name, amount');

    // Agrupar por campaña y luego por anuncio
    const campaignData: Record<string, {
      semanas: Set<number>;
      ads: Record<string, { gastos: number; ingresos: number; ventas: number }>;
    }> = {};

    // Procesar gastos (no tenemos info de anuncio en expenses, así que los distribuimos)
    (expenses || []).forEach(exp => {
      if (!campaignData[exp.campaign_name]) {
        campaignData[exp.campaign_name] = { semanas: new Set(), ads: {} };
      }
      campaignData[exp.campaign_name].semanas.add(exp.week_number);
    });

    // Procesar ventas por anuncio
    (sales || []).forEach(sale => {
      if (!sale.campaign_name) return;
      const adName = sale.image_video_name || 'Sin anuncio';
      
      if (!campaignData[sale.campaign_name]) {
        campaignData[sale.campaign_name] = { semanas: new Set(), ads: {} };
      }
      
      if (!campaignData[sale.campaign_name].ads[adName]) {
        campaignData[sale.campaign_name].ads[adName] = {
          gastos: 0,
          ingresos: 0,
          ventas: 0
        };
      }
      
      campaignData[sale.campaign_name].ads[adName].ingresos += Number(sale.amount);
      campaignData[sale.campaign_name].ads[adName].ventas += 1;
    });

    // Construir resultado
    const result: CampaignWithAds[] = Object.entries(campaignData).map(([campaignName, data]) => {
      const ads: AdROI[] = Object.entries(data.ads).map(([adName, adData]) => {
        const ganancia = adData.ingresos - adData.gastos;
        const roi = adData.gastos > 0 ? (ganancia / adData.gastos) * 100 : null;
        
        return {
          ad_name: adName,
          gastos: adData.gastos,
          ingresos: adData.ingresos,
          num_ventas: adData.ventas,
          ganancia,
          roi_porcentaje: roi
        };
      });

      const totalGastos = ads.reduce((sum, ad) => sum + ad.gastos, 0);
      const totalIngresos = ads.reduce((sum, ad) => sum + ad.ingresos, 0);
      const totalVentas = ads.reduce((sum, ad) => sum + ad.num_ventas, 0);
      const totalGanancia = totalIngresos - totalGastos;
      const roi = totalGastos > 0 ? (totalGanancia / totalGastos) * 100 : null;

      return {
        campaign_name: campaignName,
        semanas_activas: data.semanas.size,
        gastos: totalGastos,
        ingresos: totalIngresos,
        num_ventas: totalVentas,
        ganancia: totalGanancia,
        roi_porcentaje: roi,
        ads: ads.sort((a, b) => b.ganancia - a.ganancia)
      };
    });

    return result.sort((a, b) => b.ganancia - a.ganancia);
  };

  return {
    campaignsROI,
    campaignsWithAds,
    loading,
    refresh: fetchSummaryData,
  };
}