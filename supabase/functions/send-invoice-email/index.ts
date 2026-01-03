import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail?: string;
  subject?: string;
  message?: string;
  invoiceHtml: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      invoiceId, 
      recipientEmail, 
      recipientName,
      senderEmail,
      subject,
      message,
      invoiceHtml 
    }: SendInvoiceRequest = await req.json();

    console.log("Sending invoice email to:", recipientEmail);
    console.log("Invoice ID:", invoiceId);

    // Create Supabase client to fetch invoice details
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    const emailSubject = subject || `Invoice ${invoice.invoice_number} from Your Company`;
    const emailMessage = message || `Please find attached your invoice ${invoice.invoice_number}.`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .invoice-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .invoice-details h3 { margin: 0 0 10px 0; color: #1a56db; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .amount { font-size: 24px; font-weight: bold; color: #1a56db; }
            .cta-button { display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              <p>${emailMessage}</p>
              
              <div class="invoice-details">
                <h3>Invoice Details</h3>
                <div class="detail-row">
                  <span>Invoice Number:</span>
                  <strong>${invoice.invoice_number}</strong>
                </div>
                <div class="detail-row">
                  <span>Issue Date:</span>
                  <span>${new Date(invoice.date_issued).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Due Date:</span>
                  <span>${new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Amount Due:</span>
                  <span class="amount">₹${invoice.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <p>Please review the invoice and process the payment by the due date.</p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Thank you for your business!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: senderEmail || "Invoices <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
