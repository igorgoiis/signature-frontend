import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentNature, documentNatureLabels } from "@/types/document.type";

interface DocumentNatureSelectProps {
  value?: DocumentNature;
  onValueChange: (value: DocumentNature) => void;
  disabled?: boolean;
}

export default function DocumentNatureSelect({ value, onValueChange, disabled = false }: DocumentNatureSelectProps) {
  return (
    <Select 
      value={value}
      onValueChange={(value) => onValueChange(value as DocumentNature)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione a natureza" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Natureza</SelectLabel>
          {Object.values(DocumentNature).map((docNature) => (
            <SelectItem key={docNature} value={docNature}>
              {documentNatureLabels[docNature]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
