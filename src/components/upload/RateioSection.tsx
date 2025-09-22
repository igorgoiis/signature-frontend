import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, unformatCurrency } from "@/lib/utils";

export interface RateioItem {
  id: number;
  filial: string;
  centroCusto: string;
  valor: number;
  percentual: number;
}

interface RateioSectionProps {
  totalValue: number;
  rateioItems: RateioItem[];
  setRateioItems: React.Dispatch<React.SetStateAction<RateioItem[]>>;
  getTotalDistribuido: () => number;
  disabled: boolean;
}

export default function RateioSection({ 
  totalValue,
  rateioItems,
  setRateioItems,
  getTotalDistribuido,
  disabled
}: RateioSectionProps) {
  const [rateioForm, setRateioForm] = useState({
    filial: "",
    centroCusto: "",
    valor: 0
  });
  const [error, setError] = useState("");

  // Lista de filiais e centros de custo
  const filiais = [
    "Matriz Juazeiro",
    "Filial Petrolina Maquinas", 
    "Filial Petrolina Insumos",
    "Filial Irece",
    "Filial Itabaiana"
  ];

  const centrosCusto = [
    "Administrativo",
    "Vendas",
    "Operações",
    "TI",
    "Financeiro",
    "OFICINA"
  ];

  const calcularPercentual = (valorItem: number): number => {
    if (totalValue === 0) return 0;
    return (valorItem / totalValue) * 100;
  };

  const adicionarRateio = () => {
    if (!rateioForm.filial || !rateioForm.centroCusto || rateioForm.valor <= 0) {
      setError("Preencha todos os campos do rateio.");
      return;
    }

    const totalAtual = getTotalDistribuido();
    if (totalAtual + rateioForm.valor > totalValue) {
      setError("O valor do rateio excede o valor total do documento.");
      return;
    }

    const novoItem: RateioItem = {
      id: +Date.now().toString(),
      filial: rateioForm.filial,
      centroCusto: rateioForm.centroCusto,
      valor: rateioForm.valor,
      percentual: calcularPercentual(rateioForm.valor)
    };

    setRateioItems([...rateioItems, novoItem]);
    setRateioForm({ filial: "", centroCusto: "", valor: 0 });
    setError("");
  };

  const removerRateio = (id: number) => {
    setRateioItems(rateioItems.filter(item => item.id !== id));
  };

  const editarValorRateio = (id: number, novoValor: number) => {
    setRateioItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, valor: novoValor, percentual: calcularPercentual(novoValor) }
          : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rateio</CardTitle>
        <CardDescription>
          Distribua o valor do documento entre filiais e centros de custo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total do Documento:</span>
              <span className="ml-2 text-blue-600 font-semibold">
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div>
              <span className="font-medium">Total Distribuído:</span>
              <span className="ml-2 text-green-600 font-semibold">
                {formatCurrency(getTotalDistribuido())}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="grid grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
          <div>
            <Label>Filial</Label>
            <Select 
              value={rateioForm.filial || ""} 
              onValueChange={(value) => setRateioForm({...rateioForm, filial: value})}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione Filial" />
              </SelectTrigger>
              <SelectContent>
                {filiais.map((filial) => (
                  <SelectItem key={filial} value={filial}>
                    {filial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Centro de Custo</Label>
            <Select 
              value={rateioForm.centroCusto || ""} 
              onValueChange={(value) => setRateioForm({...rateioForm, centroCusto: value})}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                {centrosCusto.map((centro) => (
                  <SelectItem key={centro} value={centro}>
                    {centro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="text"
              value={formatCurrency(rateioForm.valor || 0)}
              onChange={(e) => setRateioForm({...rateioForm, valor: unformatCurrency(e.target.value)})}
              placeholder="0,00"
              disabled={disabled}
            />
          </div>
          
          <Button
            type="button"
            onClick={adicionarRateio}
            disabled={disabled}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {rateioItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centro de Custo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Lançamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rateioItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.filial}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.centroCusto}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.percentual.toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Input
                        type="text"
                        value={formatCurrency(item.valor)}
                        onChange={(e) => editarValorRateio(item.id, unformatCurrency(e.target.value))}
                        disabled={disabled}
                        className="w-32 text-right"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerRateio(item.id)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rateioItems.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-4 text-sm text-gray-900" colSpan={2}>
                      TOTAIS
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {totalValue > 0 ? ((getTotalDistribuido() / totalValue) * 100).toFixed(2) : 0}%
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatCurrency(getTotalDistribuido() || 0)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      -
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
