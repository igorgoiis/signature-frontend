
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Calculator, AlertTriangle, RefreshCw } from "lucide-react";
import { InstallmentPlan } from "@/lib/types";
import { formatCurrency, unformatCurrency } from '@/lib/utils';

interface InstallmentsSectionProps {
  totalAmount: number;
  installments: InstallmentPlan[];
  onInstallmentsChange: (installments: InstallmentPlan[]) => void;
  disabled?: boolean;
}

export default function InstallmentsSection({ 
  totalAmount, 
  installments, 
  onInstallmentsChange, 
  disabled = false 
}: InstallmentsSectionProps) {
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Função para gerar parcelas automáticas
  const generateAutoInstallments = (numInstallments: number, total: number): InstallmentPlan[] => {
    const baseAmount = Math.floor((total * 100) / numInstallments) / 100; // Arredonda para baixo
    const remainder = Math.round((total - (baseAmount * numInstallments)) * 100) / 100;
    
    return Array.from({ length: numInstallments }, (_, index) => {
      const dueDate = new Date();
      // Usar intervalos de 30 dias ao invés de meses
      dueDate.setDate(dueDate.getDate() + (30 * (index + 1)));
      
      // Adiciona o restante na primeira parcela
      let amount = baseAmount;
      if (index === 0) {
        amount += remainder;
      }
      
      return {
        installmentNumber: index + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: Math.round(amount * 100)
      };
    });
  };

  // Função para recalcular parcelas automaticamente
  const recalculateInstallments = () => {
    if (totalAmount > 0 && installments.length > 0) {
      const newInstallments = generateAutoInstallments(installments.length, totalAmount / 100);
      // Preserva as datas originais se existirem
      const updatedInstallments = newInstallments.map((newInst, index) => ({
        ...newInst,
        dueDate: installments[index]?.dueDate || newInst.dueDate
      }));
      onInstallmentsChange(updatedInstallments);
      setAutoCalculate(true);
    }
  };

  // Função para atualizar uma parcela específica
  const updateInstallment = (index: number, field: keyof InstallmentPlan, value: string | number) => {
    const updatedInstallments = [...installments];
    if (field === 'amount') {
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        [field]: Number(value)
      };
      setAutoCalculate(false); // Desativa o cálculo automático quando editado manualmente
    } else {
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        [field]: value
      };
    }
    onInstallmentsChange(updatedInstallments);
  };

  // Calcula o total das parcelas
  const getTotalInstallments = (): number => {
    return (installments.reduce((sum, inst) => sum + (inst.amount || 0), 0));
  };

  // Calcula a diferença entre o valor total e as parcelas
  const getDifference = (): number => {
    return Math.round((totalAmount - getTotalInstallments()) * 100) / 100;
  };

  // Verifica se há diferença significativa
  const hasSignificantDifference = (): boolean => {
    const diff = Math.abs(getDifference());
    return diff > 0.01; // Considera diferenças maiores que 1 centavo
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Parcelas e Vencimentos
            </CardTitle>
            <CardDescription>
              Defina os valores e datas de vencimento para cada parcela
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={recalculateInstallments}
            disabled={disabled || totalAmount <= 0 || installments.length === 0}
            title="Recalcular parcelas automaticamente"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalcular
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Financeiro */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Valor Total:</span>
              <div className="text-blue-600 font-semibold text-lg">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Parcelas:</span>
              <div className="text-green-600 font-semibold text-lg">
                {formatCurrency(getTotalInstallments())}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Diferença:</span>
              <div className={`font-semibold text-lg ${
                getDifference() === 0 ? 'text-green-600' : 
                getDifference() > 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {getDifference() > 0 ? '+' : ''}{formatCurrency(getDifference())}
              </div>
            </div>
          </div>
        </div>

        {/* Alert para diferenças */}
        {hasSignificantDifference() && (
          <Alert variant={getDifference() > 0 ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getDifference() > 0 
                ? `Há ${formatCurrency(getDifference())} não distribuído nas parcelas.`
                : `O valor das parcelas excede o total em ${formatCurrency(Math.abs(getDifference()))}.`
              }
              {!autoCalculate && " Valores editados manualmente."}
            </AlertDescription>
          </Alert>
        )}

        {/* Status do Cálculo */}
        <div className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">
            {autoCalculate ? 'Cálculo automático ativo' : 'Valores editados manualmente'}
          </span>
        </div>

        {/* Lista de Parcelas */}
        {installments.length > 0 ? (
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Parcelas ({installments.length})
            </Label>
            
            <div className="space-y-3">
              {installments.map((installment, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-white shadow-sm"
                >
                  {/* Número da Parcela */}
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">
                        {installment.installmentNumber}
                      </span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Parcela {installment.installmentNumber}
                      </Label>
                    </div>
                  </div>

                  {/* Data de Vencimento */}
                  <div>
                    <Label htmlFor={`installment-date-${index}`} className="text-sm">
                      Data de Vencimento
                    </Label>
                    <Input
                      id={`installment-date-${index}`}
                      type="date"
                      value={installment.dueDate}
                      onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                      disabled={disabled}
                      className="mt-1"
                    />
                  </div>

                  {/* Valor da Parcela */}
                  <div>
                    <Label htmlFor={`installment-amount-${index}`} className="text-sm">
                      Valor (R$)
                    </Label>
                    <Input
                      id={`installment-amount-${index}`}
                      type="text"
                      value={formatCurrency(installment.amount || 0)}
                      onChange={(e) => {
                        const newValue = unformatCurrency(e.target.value);
                        updateInstallment(index, 'amount', unformatCurrency(e.target.value))
                      }}
                      disabled={disabled}
                      className="mt-1"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Linha de Total */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-semibold text-gray-700">
                  TOTAL DAS PARCELAS
                </div>
                <div></div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    hasSignificantDifference() ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(getTotalInstallments())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhuma parcela definida</p>
            <p className="text-sm">Configure o valor total e quantidade de parcelas primeiro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
