"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Search, X, Plus, User, Mail, AlertCircle } from "lucide-react";
import { ApiService } from '@/lib/api';

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

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Signatory {
  id: string;
  userId: string;
  name: string;
  email: string;
  order: number;
}

interface SignatoriesSectionProps {
  signatories: Signatory[];
  onSignatoriesChange: (signatories: Signatory[]) => void;
  disabled?: boolean;
}

function SortableSignatoryCard({ signatory, onRemove, disabled }: {
  signatory: Signatory;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: signatory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border rounded-lg bg-white transition-shadow ${
        isDragging ? 'shadow-lg border-blue-300' : 'shadow-sm hover:shadow-md'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <Badge variant="secondary" className="min-w-[32px] justify-center">
        #{signatory.order}
      </Badge>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{signatory.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">{signatory.email}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(signatory.id)}
        disabled={disabled}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function SignatoriesSection({ 
  signatories, 
  onSignatoriesChange, 
  disabled = false 
}: SignatoriesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const searchUsers = useCallback(
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
        const response = await ApiService.get(`/users/search?q=${encodeURIComponent(query)}`);
        
        if (!response) {
          throw new Error('Não foi possível conectar ao servidor');
        }

        // Handle different response formats
        let users: User[] = [];
        
        if (Array.isArray(response)) {
          // Case 1: Direct array response
          users = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Case 2: Wrapped in data property
          users = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          // Case 3: Wrapped in users property
          users = response.users;
        } else {
          throw new Error('Formato de resposta não reconhecido');
        }

        // Filter out invalid users and existing signatories
        const currentSignatoryEmails = signatories.map(s => s.email);
        const filteredResults = users.filter((user: User) => 
          user?.id && 
          user?.name && 
          user?.email &&
          !currentSignatoryEmails.includes(user.email)
        );

        setSearchResults(filteredResults);
        setShowResults(true);
      } catch (error) {
        console.error('Erro na busca de usuários:', error);
        setSearchError(
          error instanceof Error 
            ? error.message 
            : 'Ocorreu um erro inesperado ao buscar usuários'
        );
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [signatories]
  );

  useEffect(() => {
    searchUsers(searchQuery);
    return () => {
      searchUsers.cancel();
    };
  }, [searchQuery, searchUsers]);

  const addSignatoryFromSearch = (user: User) => {
    const newSignatory: Signatory = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name: user.name,
      email: user.email,
      order: signatories.length + 1
    };

    onSignatoriesChange([...signatories, newSignatory]);
    setSearchQuery('');
    setShowResults(false);
  };

  const removeSignatory = (id: string) => {
    const updatedSignatories = signatories
      .filter(s => s.id !== id)
      .map((s, index) => ({ ...s, order: index + 1 }));
    
    onSignatoriesChange(updatedSignatories);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = signatories.findIndex(s => s.id === active.id);
    const newIndex = signatories.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedSignatories = arrayMove(signatories, oldIndex, newIndex)
        .map((s, index) => ({ ...s, order: index + 1 }));
      
      onSignatoriesChange(reorderedSignatories);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signatários</CardTitle>
        <CardDescription>
          Busque usuários e defina a ordem de assinatura arrastando os cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Buscar Usuários</Label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Digite nome ou email para buscar usuários..."
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
                    Buscando usuários...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addSignatoryFromSearch(user)}
                        disabled={disabled}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.role && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>
          
          {searchError && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {searchError}
            </div>
          )}
        </div>

        {signatories.length > 0 ? (
          <div className="space-y-3">
            <Label>Signatários Selecionados ({signatories.length})</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={signatories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {signatories.map((signatory) => (
                    <SortableSignatoryCard
                      key={signatory.id}
                      signatory={signatory}
                      onRemove={removeSignatory}
                      disabled={disabled || signatories.length === 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum signatário selecionado</p>
            <p className="text-sm">Use a busca acima para adicionar usuários como signatários</p>
          </div>
        )}

        {signatories.length === 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            É necessário adicionar pelo menos um signatário
          </div>
        )}
      </CardContent>
    </Card>
  );
}