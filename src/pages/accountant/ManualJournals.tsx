import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ManualJournal {
  id: string;
  journal_number: string;
  date: string;
  reference: string | null;
  status: string;
  notes: string | null;
}

interface JournalEntry {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
}

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];

const ManualJournals = () => {
  const [journals, setJournals] = useState<ManualJournal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJournal, setEditingJournal] = useState<ManualJournal | null>(null);
  const [formData, setFormData] = useState({
    journal_number: "",
    date: format(new Date(), "yyyy-MM-dd"),
    reference: "",
    status: "DRAFT",
    notes: "",
  });
  const [entries, setEntries] = useState<JournalEntry[]>([
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
  ]);

  const fetchJournals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("manual_journals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch journals");
    } else {
      setJournals(data || []);
    }
    setLoading(false);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("id, account_name, account_type")
      .eq("status", "Active")
      .order("account_name");
    setAccounts(data || []);
  };

  const generateJournalNumber = async () => {
    const { count } = await supabase
      .from("manual_journals")
      .select("*", { count: "exact", head: true });
    return `JV-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchJournals();
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that debits equal credits
    const totalDebits = entries.reduce((sum, e) => sum + e.debit_amount, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.credit_amount, 0);

    if (totalDebits !== totalCredits) {
      toast.error("Total debits must equal total credits");
      return;
    }

    if (totalDebits === 0) {
      toast.error("Journal must have at least one entry with an amount");
      return;
    }

    const validEntries = entries.filter((e) => e.account_id && (e.debit_amount > 0 || e.credit_amount > 0));
    if (validEntries.length < 2) {
      toast.error("Journal must have at least 2 entries");
      return;
    }

    const payload = {
      journal_number: formData.journal_number,
      date: formData.date,
      reference: formData.reference || null,
      status: formData.status,
      notes: formData.notes || null,
    };

    if (editingJournal) {
      const { error } = await supabase
        .from("manual_journals")
        .update(payload)
        .eq("id", editingJournal.id);

      if (error) {
        toast.error("Failed to update journal");
        return;
      }

      // Delete existing entries and re-insert
      await supabase.from("journal_entries").delete().eq("journal_id", editingJournal.id);

      const entriesPayload = validEntries.map((e) => ({
        journal_id: editingJournal.id,
        account_id: e.account_id,
        debit_amount: e.debit_amount,
        credit_amount: e.credit_amount,
        description: e.description || null,
      }));

      const { error: entriesError } = await supabase.from("journal_entries").insert(entriesPayload);

      if (entriesError) {
        toast.error("Failed to update journal entries");
      } else {
        toast.success("Journal updated successfully");
        setOpenDialog(false);
        fetchJournals();
      }
    } else {
      const { data, error } = await supabase.from("manual_journals").insert(payload).select().single();

      if (error || !data) {
        toast.error("Failed to create journal");
        return;
      }

      const entriesPayload = validEntries.map((e) => ({
        journal_id: data.id,
        account_id: e.account_id,
        debit_amount: e.debit_amount,
        credit_amount: e.credit_amount,
        description: e.description || null,
      }));

      const { error: entriesError } = await supabase.from("journal_entries").insert(entriesPayload);

      if (entriesError) {
        toast.error("Failed to create journal entries");
      } else {
        toast.success("Journal created successfully");
        setOpenDialog(false);
        fetchJournals();
      }
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("journal_entries").delete().eq("journal_id", id);
    const { error } = await supabase.from("manual_journals").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete journal");
    } else {
      toast.success("Journal deleted successfully");
      fetchJournals();
    }
  };

  const handleEdit = async (journal: ManualJournal) => {
    setEditingJournal(journal);
    setFormData({
      journal_number: journal.journal_number,
      date: journal.date,
      reference: journal.reference || "",
      status: journal.status,
      notes: journal.notes || "",
    });

    // Fetch entries
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("journal_id", journal.id);

    if (data && data.length > 0) {
      setEntries(
        data.map((e) => ({
          account_id: e.account_id,
          debit_amount: e.debit_amount,
          credit_amount: e.credit_amount,
          description: e.description || "",
        }))
      );
    } else {
      setEntries([
        { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
        { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
      ]);
    }

    setOpenDialog(true);
  };

  const handleNewJournal = async () => {
    const journalNumber = await generateJournalNumber();
    setEditingJournal(null);
    setFormData({
      journal_number: journalNumber,
      date: format(new Date(), "yyyy-MM-dd"),
      reference: "",
      status: "DRAFT",
      notes: "",
    });
    setEntries([
      { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
      { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
    ]);
    setOpenDialog(true);
  };

  const addEntry = () => {
    setEntries([...entries, { account_id: "", debit_amount: 0, credit_amount: 0, description: "" }]);
  };

  const updateEntry = (index: number, field: keyof JournalEntry, value: string | number) => {
    const updated = [...entries];
    if (field === "debit_amount" || field === "credit_amount") {
      updated[index][field] = parseFloat(value as string) || 0;
    } else {
      updated[index][field] = value as string;
    }
    setEntries(updated);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      DRAFT: "secondary",
      PUBLISHED: "default",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const totalDebits = entries.reduce((sum, e) => sum + e.debit_amount, 0);
  const totalCredits = entries.reduce((sum, e) => sum + e.credit_amount, 0);

  const columns: ColumnDef<ManualJournal>[] = [
    { accessorKey: "journal_number", header: "Journal#" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => row.original.reference || "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const topbarButtons = (
    <Button className="bg-books-blue hover:bg-blue-700" onClick={handleNewJournal}>
      <Plus className="h-4 w-4 mr-1" /> New Journal
    </Button>
  );

  return (
    <MainLayout title="Manual Journals" searchPlaceholder="Search journals" topbarButtons={topbarButtons}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-books-blue" />
          <h1 className="text-2xl font-bold">Manual Journals</h1>
        </div>

        <DataTable columns={columns} data={journals} isLoading={loading} />

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJournal ? "Edit Journal" : "New Journal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Journal Number</Label>
                  <Input value={formData.journal_number} disabled />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Journal Entries</Label>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Account</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2">Debit</div>
                    <div className="col-span-2">Credit</div>
                    <div className="col-span-1"></div>
                  </div>
                  {entries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Select value={entry.account_id} onValueChange={(v) => updateEntry(index, "account_id", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.account_name} ({a.account_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Description"
                          value={entry.description}
                          onChange={(e) => updateEntry(index, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={entry.debit_amount || ""}
                          onChange={(e) => updateEntry(index, "debit_amount", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={entry.credit_amount || ""}
                          onChange={(e) => updateEntry(index, "credit_amount", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(index)}
                          disabled={entries.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                  <div className="grid grid-cols-12 gap-2 pt-2 border-t font-medium">
                    <div className="col-span-7 text-right">Totals:</div>
                    <div className="col-span-2">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalDebits)}
                    </div>
                    <div className="col-span-2">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalCredits)}
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                  {totalDebits !== totalCredits && (
                    <p className="text-sm text-destructive">Debits and credits must be equal</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-books-blue hover:bg-blue-700">
                  {editingJournal ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ManualJournals;
