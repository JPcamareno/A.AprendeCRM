import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyExpense {
  date: string;
  amount: number;
  campaign_name: string;
}

interface ExpenseChartProps {
  expenses: DailyExpense[];
  height?: number;
}

export function ExpenseChart({ expenses, height = 200 }: ExpenseChartProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const dailyTotals = expenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = 0;
    }
    acc[expense.date] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedData = Object.entries(dailyTotals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));

  const maxAmount = Math.max(...sortedData.map(d => d.amount));
  const minAmount = Math.min(...sortedData.map(d => d.amount));

  const firstAmount = sortedData[0]?.amount || 0;
  const lastAmount = sortedData[sortedData.length - 1]?.amount || 0;
  const change = lastAmount - firstAmount;
  const changePercentage = firstAmount > 0 ? (change / firstAmount) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tendencia de Gastos Diarios
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {sortedData.length} días de datos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {changePercentage > 5 && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+{changePercentage.toFixed(1)}%</span>
            </div>
          )}
          {changePercentage < -5 && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">{changePercentage.toFixed(1)}%</span>
            </div>
          )}
          {Math.abs(changePercentage) <= 5 && (
            <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
              <Minus className="h-4 w-4" />
              <span className="text-sm font-medium">Estable</span>
            </div>
          )}
        </div>
      </div>

      <div 
        className="relative border-b border-l border-gray-200"
        style={{ height: `${height}px` }}
      >
        <div className="absolute inset-0 flex items-end justify-around gap-1 px-2 pb-8">
          {sortedData.map((data, index) => {
            const barHeight = (data.amount / maxAmount) * 100;
            const isFirst = index === 0;
            const isLast = index === sortedData.length - 1;
            const isHighest = data.amount === maxAmount;
            const isLowest = data.amount === minAmount;
            
            return (
              <div
                key={data.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                <div className="w-full flex items-end justify-center">
                  <div
                    className={`w-full transition-all duration-300 rounded-t-sm ${
                      isHighest
                        ? 'bg-red-500 hover:bg-red-600'
                        : isLowest
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>

                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">
                      {format(parseISO(data.date), "d 'de' MMM", { locale: es })}
                    </div>
                    <div className="mt-1">
                      ₡{data.amount.toLocaleString('es-CR')}
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 transform rotate-45 mx-auto -mt-1"></div>
                </div>

                {(isFirst || isLast || sortedData.length <= 7 || index % Math.ceil(sortedData.length / 7) === 0) && (
                  <div className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left mt-1 whitespace-nowrap">
                    {format(parseISO(data.date), 'd MMM', { locale: es })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedData.length > 1 && (
          <>
            {(() => {
              const average = sortedData.reduce((sum, d) => sum + d.amount, 0) / sortedData.length;
              const avgPosition = (average / maxAmount) * 100;
              
              return (
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400"
                  style={{ bottom: `${avgPosition}%` }}
                >
                  <span className="absolute -left-2 -top-3 text-[10px] text-gray-600 bg-white px-1">
                    Promedio: ₡{average.toLocaleString('es-CR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Gasto más alto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Gasto más bajo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Otros días</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xs text-gray-500">Máximo</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">
            ₡{maxAmount.toLocaleString('es-CR')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Promedio</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">
            ₡{(sortedData.reduce((sum, d) => sum + d.amount, 0) / sortedData.length).toLocaleString('es-CR', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Mínimo</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">
            ₡{minAmount.toLocaleString('es-CR')}
          </div>
        </div>
      </div>
    </div>
  );
}