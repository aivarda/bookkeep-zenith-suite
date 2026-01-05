import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle } from "lucide-react";
import { FieldMapping } from "@/lib/import-utils";

interface TargetField {
  field: string;
  label: string;
  required: boolean;
}

interface FieldMapperProps {
  sourceColumns: string[];
  targetFields: TargetField[];
  mappings: FieldMapping[];
  onMappingChange: (mappings: FieldMapping[]) => void;
}

export const FieldMapper = ({
  sourceColumns,
  targetFields,
  mappings,
  onMappingChange,
}: FieldMapperProps) => {
  const handleMappingChange = (targetField: string, sourceField: string) => {
    const newMappings = mappings.filter((m) => m.targetField !== targetField);
    
    if (sourceField && sourceField !== "none") {
      newMappings.push({ sourceField, targetField });
    }
    
    onMappingChange(newMappings);
  };

  const getMappedSource = (targetField: string): string => {
    const mapping = mappings.find((m) => m.targetField === targetField);
    return mapping?.sourceField || "none";
  };

  const isMapped = (targetField: string): boolean => {
    return mappings.some((m) => m.targetField === targetField);
  };

  const requiredFields = targetFields.filter((f) => f.required);
  const optionalFields = targetFields.filter((f) => !f.required);
  const allRequiredMapped = requiredFields.every((f) => isMapped(f.field));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {allRequiredMapped ? (
          <Badge variant="default" className="bg-green-600">
            <Check className="h-3 w-3 mr-1" /> All required fields mapped
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Map required fields
          </Badge>
        )}
      </div>

      {/* Required Fields */}
      {requiredFields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-foreground">Required Fields</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredFields.map((field) => (
              <div key={field.field} className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  <span className="text-destructive">*</span>
                  {isMapped(field.field) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </Label>
                <Select
                  value={getMappedSource(field.field)}
                  onValueChange={(value) => handleMappingChange(field.field, value)}
                >
                  <SelectTrigger className={!isMapped(field.field) ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {sourceColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Fields */}
      {optionalFields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Optional Fields</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalFields.map((field) => (
              <div key={field.field} className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {isMapped(field.field) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </Label>
                <Select
                  value={getMappedSource(field.field)}
                  onValueChange={(value) => handleMappingChange(field.field, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {sourceColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
