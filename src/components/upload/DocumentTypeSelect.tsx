import { DocumentType, documentTypeLabels } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentTypeSelectProps {
  value?: DocumentType;
  onValueChange: (value: DocumentType) => void;
  disabled?: boolean;
}

export default function DocumentTypeSelect({ value, onValueChange, disabled = false }: DocumentTypeSelectProps) {
  return (
    <Select 
      value={value}
      onValueChange={(value) => onValueChange(value as DocumentType)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione o tipo" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Tipos de Documento</SelectLabel>
          {Object.values(DocumentType).map((docType) => (
            <SelectItem key={docType} value={docType}>
              {documentTypeLabels[docType]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
