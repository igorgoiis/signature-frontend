"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, Building2, AlertCircle, Check } from "lucide-react";
import { ApiService } from "@/lib/api";
import { Supplier as AppSupplier } from "@/lib/types"; // Importe o tipo Supplier do lib/types

// Interface para o tipo de Supplier retornado pela API
interface ApiSupplier {
  id: number;
  codigo?: string;
  cpfCnpj: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Função de debounce para evitar chamadas desnecessárias à API
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): {
  (...args: Parameters<T>): void;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;
  
  const executedFunction = function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  executedFunction.cancel = function() {
    if (timeout) clearTimeout(timeout);
  };
  
  return executedFunction;
}

interface SupplierSectionProps {
  selectedSupplier: AppSupplier | null;
  onSupplierChange: (supplier: AppSupplier | null) => void;
  disabled?: boolean;
}

export default function SupplierSection({ 
  selectedSupplier, 
  onSupplierChange, 
  disabled = false 
}: SupplierSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiSupplier[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');

  /**
   * Converte um ApiSupplier para o formato AppSupplier usado pelo app
   */
  const convertToAppSupplier = (supplier: ApiSupplier): AppSupplier => {
    return {
      id: supplier.id, // Garantimos que id seja sempre uma string
      code: supplier.codigo || "",
      cpfCnpj: supplier.cpfCnpj,
      companyName: supplier.razaoSocial || "",
      tradeName: supplier.nomeFantasia || "",
      createdAt: supplier.createdAt || '',
      updatedAt: supplier.updatedAt || '',
    };
  };

  /**
   * Busca fornecedores na API com debounce
   */
  const searchSuppliers = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError('');

      try {
        const response = await ApiService.get(`/fornecedores/search?q=${encodeURIComponent(query)}`);
        
        if (!response) {
          throw new Error('Não foi possível conectar ao servidor');
        }

        let suppliers: ApiSupplier[] = [];
        
        if (Array.isArray(response.data)) {
          suppliers = response.data;
        }

        // Filtra fornecedores válidos
        const validSuppliers = suppliers.filter(supplier => 
          supplier?.id && 
          supplier?.razaoSocial && 
          supplier?.cpfCnpj
        );

        setSearchResults(validSuppliers);
        setShowResults(true);
      } catch (error) {
        console.error('Erro na busca de fornecedores:', error);
        setSearchError(
          error instanceof Error 
            ? error.message 
            : 'Ocorreu um erro inesperado ao buscar fornecedores'
        );
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  /**
   * Efetua a busca quando o query muda
   */
  useEffect(() => {
    searchSuppliers(searchQuery);
    
    // Cleanup função para cancelar o debounce
    return () => {
      searchSuppliers.cancel();
    };
  }, [searchQuery, searchSuppliers]);

  /**
   * Seleciona um fornecedor
   */
  const selectSupplier = (supplier: ApiSupplier) => {
    onSupplierChange(convertToAppSupplier(supplier));
    setSearchQuery('');
    setShowResults(false);
  };

  /**
   * Limpa o fornecedor selecionado
   */
  const clearSupplier = () => {
    onSupplierChange(null);
  };

  /**
   * Formata CNPJ para exibição
   */
  const formatCpfOrCnpj = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

  /**
   * Obtém o código do fornecedor para exibição
   */
  const getSupplierCode = (supplier: ApiSupplier): string => {
    return supplier.codigo || "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fornecedor</CardTitle>
        <CardDescription>
          Busque e selecione o fornecedor do documento (por código, CNPJ, razão social ou nome fantasia)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSupplier ? (
          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green-900">{selectedSupplier.companyName}</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  {selectedSupplier.tradeName && (
                    <div className="text-sm text-green-700 mb-1">
                      Nome Fantasia: {selectedSupplier.tradeName}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-sm text-green-700">
                    <div>Código: {selectedSupplier.code}</div>
                    <div>CPF/CNPJ: {formatCpfOrCnpj(selectedSupplier.cpfCnpj)}</div>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSupplier}
                disabled={disabled}
                className="text-green-600 hover:text-green-800 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Buscar Fornecedor</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Digite código, CNPJ, razão social ou nome fantasia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={disabled}
                  className="pl-10"
                />
              </div>
              
              {showResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Buscando fornecedores...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((supplier) => (
                        <button
                          key={String(supplier.id)}
                          type="button"
                          onClick={() => selectSupplier(supplier)}
                          disabled={disabled}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{supplier.razaoSocial}</div>
                              {supplier.nomeFantasia && (
                                <div className="text-sm text-gray-600">{supplier.nomeFantasia}</div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span>Código: {getSupplierCode(supplier)}</span>
                                <span>CPF/CNPJ: {formatCpfOrCnpj(supplier.cpfCnpj)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      {searchError || 'Nenhum fornecedor encontrado'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {searchError && !showResults && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {searchError}
              </div>
            )}
          </div>
        )}

        {!selectedSupplier && !searchQuery && (
          <div className="text-center py-6 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum fornecedor selecionado</p>
            <p className="text-sm">Use a busca acima para encontrar e selecionar um fornecedor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
