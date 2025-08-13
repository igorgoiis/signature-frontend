"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X, Building2, AlertCircle, Check } from "lucide-react";
import { ApiService } from "@/lib/api";

// Updated Supplier interface to match API response
interface Supplier {
  id: number;
  codigo: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  
  const executedFunction = function(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  executedFunction.cancel = function() {
    clearTimeout(timeout);
  };
  
  return executedFunction;
}

interface SupplierSectionProps {
  selectedSupplier: Supplier | null;
  onSupplierChange: (supplier: Supplier | null) => void;
  disabled?: boolean;
}

export default function SupplierSection({ 
  selectedSupplier, 
  onSupplierChange, 
  disabled = false 
}: SupplierSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Supplier[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');

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

        let suppliers: Supplier[] = [];
        
        if (Array.isArray(response)) {
          suppliers = response;
        } else if (Array.isArray(response.data)) {
          suppliers = response.data;
        } else if (Array.isArray(response.fornecedores)) {
          suppliers = response.fornecedores;
        } else {
          suppliers = [response].filter(item => item && !Array.isArray(item));
        }

        const validSuppliers = suppliers.filter(supplier => 
          supplier?.id && 
          supplier?.razaoSocial && 
          supplier?.cnpj
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

  useEffect(() => {
    searchSuppliers(searchQuery);
    return () => {
      searchSuppliers.cancel();
    };
  }, [searchQuery, searchSuppliers]);

  const selectSupplier = (supplier: Supplier) => {
    onSupplierChange(supplier);
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSupplier = () => {
    onSupplierChange(null);
  };

  const formatCNPJ = (cnpj: string) => {
    const digits = cnpj.replace(/[^\d]/g, '');
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
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
                    <span className="font-semibold text-green-900">{selectedSupplier.razaoSocial}</span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  {selectedSupplier.nomeFantasia && (
                    <div className="text-sm text-green-700 mb-1">
                      Nome Fantasia: {selectedSupplier.nomeFantasia}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-sm text-green-700">
                    <div>Código: {selectedSupplier.codigo}</div>
                    <div>CNPJ: {formatCNPJ(selectedSupplier.cnpj)}</div>
                    {selectedSupplier.email && (
                      <div>Email: {selectedSupplier.email}</div>
                    )}
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
                          key={supplier.id}
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
                                <span>Código: {supplier.codigo}</span>
                                <span>CNPJ: {formatCNPJ(supplier.cnpj)}</span>
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