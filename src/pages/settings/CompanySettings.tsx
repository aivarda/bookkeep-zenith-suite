import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { companySettingsSchema, type CompanySettingsFormData } from "@/lib/validations";
import { Loader2, Building2 } from "lucide-react";

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const form = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      company_name: "",
      address: "",
      gstin: "",
      email: "",
      phone: "",
      logo_url: "",
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettingsId(data.id);
        form.reset({
          company_name: data.company_name || "",
          address: data.address || "",
          gstin: data.gstin || "",
          email: data.email || "",
          phone: data.phone || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanySettingsFormData) => {
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from("company_settings")
          .update({
            company_name: data.company_name,
            address: data.address || null,
            gstin: data.gstin || null,
            email: data.email || null,
            phone: data.phone || null,
            logo_url: data.logo_url || null,
          })
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { data: newSettings, error } = await supabase
          .from("company_settings")
          .insert({
            company_name: data.company_name,
            address: data.address || null,
            gstin: data.gstin || null,
            email: data.email || null,
            phone: data.phone || null,
            logo_url: data.logo_url || null,
          })
          .select()
          .single();

        if (error) throw error;
        if (newSettings) setSettingsId(newSettings.id);
      }

      toast.success("Company settings saved successfully");
    } catch (error) {
      console.error("Error saving company settings:", error);
      toast.error("Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  const watchedValues = form.watch();

  if (loading) {
    return (
      <MainLayout title="Company Settings" searchPlaceholder="Search settings...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Company Settings" searchPlaceholder="Search settings...">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Configure your company details for invoices and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Business Street, City, State - 123456" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="22AAAAA0000A1Z5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="company@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Header Preview</CardTitle>
            <CardDescription>
              This is how your company information will appear on invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-background">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {watchedValues.logo_url ? (
                    <img 
                      src={watchedValues.logo_url} 
                      alt="Company Logo" 
                      className="h-16 w-16 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {watchedValues.company_name || "Your Company Name"}
                    </h3>
                    {watchedValues.address && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                        {watchedValues.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  {watchedValues.gstin && (
                    <p><span className="font-medium">GSTIN:</span> {watchedValues.gstin}</p>
                  )}
                  {watchedValues.email && (
                    <p><span className="font-medium">Email:</span> {watchedValues.email}</p>
                  )}
                  {watchedValues.phone && (
                    <p><span className="font-medium">Phone:</span> {watchedValues.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CompanySettings;
