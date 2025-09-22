'use client'

import { Document } from "@/types/document.type";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useInstallmentsDocuments } from "@/hooks/use-installments-documents";
import { ChevronDownIcon, Eye, FileText, HandCoins, Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "../ui/badge";
import { documentTypeLabels } from "@/lib/types";
import { formatCurrency, getSignatureStatusBadge } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DocumentInstallment } from "@/types/document-installment.type";
import { DocumentSignatory, SignatoryStatus } from "@/types/document-signatory.type";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DatePicker } from "../common/DatePicker";
import { Controller } from "react-hook-form";

interface InstallmentsDocumentsClientWrapperProps {
  initialData: Document[];
  userRole: string | undefined;
}

export default function InstallmentsDocumentsClientWrapper({ initialData }: InstallmentsDocumentsClientWrapperProps) {
  console.log({ initialData})
  const {
    documentsInstallments,
    loading,
    installmentForPayment,
    control,
    setInstallmentPayment,
    handleSubmit,
    handleInstallmentPaymentSubmit
  } = useInstallmentsDocuments({ initialData });

  const getTotalInstallmentsAmount = (installments: DocumentInstallment[]) => (
    installments.reduce((acc, installment) => {
      return acc + Number(installment.amount)
    }, 0)
  );

  const getTotalAmountOfOverdueInstallments = (installments: DocumentInstallment[]) => (
    installments.filter((installment) => new Date() > new Date(installment.dueDate)).reduce((acc, installment) => {
      return acc + Number(installment.amount)
    }, 0)
  );

  const getTotalAmountOfTheInstallmentsDueInTheFiveDays = (installments: DocumentInstallment[]) => (
    installments.filter((installment) => new Date() <= new Date(installment.dueDate)).reduce((acc, installment) => {
      return acc + Number(installment.amount)
    }, 0)
  );

  const renderInstallments = (installments: DocumentInstallment[]) => {
    return (
      <Collapsible className='flex w-full flex-col gap-2'>
        <div className='flex flex-col justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors'>
          <div className="flex flex-1 items-center justify-between">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-xs">Total de parcelas: <strong>{installments.length}</strong></p>
              <p className="text-xs">
                Valor total das parcelas: <strong>{formatCurrency(getTotalInstallmentsAmount(installments) * 100)}</strong>
              </p>
              <p className="text-xs">
                Valor total das parcelas atrasadas: <strong>{formatCurrency(getTotalAmountOfOverdueInstallments(installments) * 100)}</strong>
              </p>
              <p className="text-xs">
                Valor total das parcelas à vencer nos próximos 5 dias: <strong>{formatCurrency(getTotalAmountOfTheInstallmentsDueInTheFiveDays(installments) * 100)}</strong>
              </p>
            </div>
            <CollapsibleTrigger asChild className='group'>
              <Button variant='ghost' size='icon' className='size-8'>
                <ChevronDownIcon className='text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180' />
                <span className='sr-only'>Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down flex flex-col gap-2 overflow-hidden transition-all duration-300'>
            {installments.map((installment) => (
              <div className='flex justify-between rounded-md border px-4 py-2 gap-1'>
                <div className="flex-1">
                  <h5 className="text-sm font-medium">{installment.installmentNumber}ª Parcela</h5>
                  <div className="grid grid-cols-3 mt-4">
                    <p className="text-xs">Valor: {formatCurrency(installment.amount * 100)}</p>
                    <p className="text-xs">Data de vencimento: {format(parse(installment.dueDate, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 py-1 px-4 bg-green-600 hover:bg-green-700" onClick={() => setInstallmentPayment(installment)}>
                          <HandCoins className="h-5 w-5" />
                          <span className="text-xs">Pagar parcela</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='data-[state=open]:!zoom-in-100 data-[state=open]:slide-in-from-bottom-20 data-[state=open]:duration-800 sm:max-w-[425px]'>
                        <DialogHeader>
                          <DialogTitle>Pagar {installmentForPayment?.installmentNumber}ª Parcela</DialogTitle>
                          <DialogDescription>
                            Para realizar o pagamento da parcela precisamos que informe a data de pagamento e anexe o comprovante
                          </DialogDescription>
                        </DialogHeader>
                        <div className='grid gap-4'>
                          <div className='grid gap-3'>
                            <Controller
                              control={control}
                              name="date"
                              render={({ field: { onChange, value }, fieldState }) => (
                                <>
                                  <DatePicker
                                    label="Data de pagamento"
                                    onChange={onChange}
                                    date={value}
                                  />
                                  {fieldState.error && (
                                    <span className="text-red-500 text-xs">{fieldState.error.message}</span>
                                  )}
                                </>
                              )}
                            />
                          </div>
                          <div className='grid gap-3'>
                            <Controller
                              control={control}
                              name="proof"
                              render={({ field: { value, onChange, name }, fieldState }) => (
                                <div className='w-full max-w-xs space-y-2'>
                                  <Label htmlFor={name}>Comprovante de pagamento</Label>
                                  <Input
                                    id={name}
                                    type='file'
                                    accept=".pdf,.png,.jpeg,.jpg"
                                    className='text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:me-3 file:h-full file:border-0 file:border-e file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic'
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      onChange(file)
                                    }}
                                  />
                                  {fieldState.error && (
                                    <span className="text-red-500 text-xs">{fieldState.error.message}</span>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant='outline' onClick={() => setInstallmentPayment(null)}>Cancelar</Button>
                          </DialogClose>
                          <Button onClick={handleSubmit(handleInstallmentPaymentSubmit)}>Pagar parcela</Button>
                        </DialogFooter>
                      </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  const renderSignatureStatusBadge = (signatory: DocumentSignatory) => {
    const { Icon, config } = getSignatureStatusBadge(signatory.status);

    console.log({ Icon, config, signatory });
  
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {signatory.user?.name}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {documentsInstallments.length} documento(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : documentsInstallments.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <motion.svg
                data-slot='checkbox-indicator'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='3.5'
                stroke='currentColor'
                className='w-[100px] text-slate-500'
                initial='unchecked'
                animate={documentsInstallments.length === 0 ? 'checked' : 'unchecked'}
              >
                <motion.path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M4.5 12.75l6 6 9-13.5'
                  variants={{
                    checked: {
                      pathLength: 1,
                      opacity: 1,
                      transition: {
                        duration: 0.2,
                        delay: 0.2
                      }
                    },
                    unchecked: {
                      pathLength: 0,
                      opacity: 0,
                      transition: {
                        duration: 0.2
                      }
                    }
                  }}
                />
              </motion.svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-500">
                Todos os documentos estão com as parcelas em dias.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documentsInstallments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col flex-1 space-y-6">
                    <div className="flex flex-row flex-1 justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {document.title || document.file.fileName}
                          </h3>
                          {document.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {document.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Criado {formatDistanceToNow(new Date(document.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                            {document.owner && (
                              <span className="ml-2">
                                por {document.owner.name}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            <p className="text-sm text-gray-500">Signatários: </p>
                            {document.signatories.map((signatory) => {
                              return renderSignatureStatusBadge(signatory)
                            })}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {document.tipoDocumento && (
                              <Badge variant="outline">
                                {documentTypeLabels[document.tipoDocumento]}
                              </Badge>
                            )}
                            {document.valor && (
                              <span className="text-xs text-gray-500">
                                {formatCurrency(document.valor * 100)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {document.installments?.length || 0} parcela(s)
                            </span>
                            {document.fornecedor && (
                              <span className="text-xs text-gray-500">
                                {document.fornecedor.razaoSocial}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/documentos/${document.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                    </div>
                    {renderInstallments(document.installments)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}