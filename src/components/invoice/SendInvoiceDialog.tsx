import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  clientEmail?: string;
  clientName?: string;
}

const SendInvoiceDialog = ({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  clientEmail = "",
  clientName = "",
}: SendInvoiceDialogProps) => {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    recipientEmail: clientEmail,
    recipientName: clientName,
    subject: `Invoice ${invoiceNumber}`,
    message: `Please find your invoice ${invoiceNumber}. Thank you for your business!`,
  });

  const handleSend = async () => {
    if (!formData.recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceId,
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          subject: formData.subject,
          message: formData.message,
          invoiceHtml: "", // Not used in current implementation
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Invoice sent successfully!");
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Failed to send invoice");
      }
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast.error(error.message || "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice
          </DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to your customer via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="customer@example.com"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              placeholder="Customer Name"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendInvoiceDialog;
