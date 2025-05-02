
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const SupabaseNote = () => {
  return (
    <Alert className="bg-books-light-blue/20 border-books-blue mb-6">
      <AlertCircle className="h-4 w-4 text-books-blue" />
      <AlertTitle>Supabase Integration Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          To enable full functionality including authentication and database storage, please connect your Lovable Project to Supabase using the native integration.
        </p>
        <div>
          <Button variant="outline" className="text-books-blue border-books-blue mt-2">
            Connect Supabase
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
