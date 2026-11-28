"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Headset, MessageSquareText, RefreshCw, Send } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = { id: string; business_name: string };
type Ticket = { id: string; ticket_number: string; subject: string; description: string; category: string; priority: string; status: string; created_at: string; resolution: string | null };
type Category = "business_support" | "general" | "feedback" | "grievance";
type Priority = "low" | "medium" | "high" | "critical";
const statuses: Record<string,string> = { open:"Open", in_progress:"In Progress", waiting_for_customer:"Waiting for You", resolved:"Resolved", closed:"Closed" };
const statusClass = (status:string) => status === "resolved" || status === "closed" ? "bg-emerald-50 text-emerald-700" : status === "open" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800";
const formatDate = (value:string) => new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));

export default function BusinessSupportPage() {
  const [business,setBusiness]=useState<Business|null>(null);
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [userEmail,setUserEmail]=useState("");
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [category,setCategory]=useState<Category>("business_support");
  const [priority,setPriority]=useState<Priority>("medium");
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const supabase=useMemo(()=>createSupabaseBrowserClient(),[]);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError) throw userError;
      if(!user) throw new Error("Please sign in to contact business support.");
      setUserEmail(user.email||"");
      const {data:businessData,error:businessError}=await supabase.from("businesses").select("id,business_name").eq("owner_profile_id",user.id).eq("is_active",true).is("deleted_at",null).order("created_at",{ascending:true}).limit(1).maybeSingle();
      if(businessError) throw businessError;
      if(!businessData) throw new Error("No active business profile was found for your account.");
      setBusiness(businessData as Business);
      const {data:ticketData,error:ticketError}=await supabase.from("support_tickets").select("id,ticket_number,subject,description,category,priority,status,created_at,resolution").eq("business_id",businessData.id).order("created_at",{ascending:false}).limit(50);
      if(ticketError) throw ticketError;
      setTickets((ticketData||[]) as Ticket[]);
    } catch(e) { setError(e instanceof Error?e.message:"Unable to load business support."); }
    finally {setLoading(false);}
  },[supabase]);

  useEffect(()=>{void Promise.resolve().then(()=>load());},[load]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!business||submitting)return;
    const cleanSubject=subject.trim(),cleanMessage=message.trim();
    if(!cleanSubject||!cleanMessage){setError("Please enter a subject and message.");return;}
    if(cleanSubject.length>200||cleanMessage.length>10000){setError("Subject must be under 200 characters and message under 10,000 characters.");return;}
    setSubmitting(true);setError("");setSuccess("");
    try {
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user) throw new Error("Your session has expired. Please sign in again.");
      const {data:ticketId,error:ticketError}=await supabase.rpc("create_support_ticket",{
        p_profile_id:user.id,p_subject:cleanSubject,p_description:cleanMessage,p_category:category,
        p_business_id:business.id,p_priority:priority,
        p_metadata:{source:"business_dashboard",business_name:business.business_name,name:business.business_name,email:user.email||null}
      });
      if(ticketError||!ticketId) throw new Error(ticketError?.message||"We could not submit your request. Please try again.");
      const {data:ticket}=await supabase.from("support_tickets").select("ticket_number").eq("id",ticketId).maybeSingle();
      setSuccess("Your request was submitted successfully. Reference: "+(ticket?.ticket_number||ticketId));
      setSubject("");setMessage("");setCategory("business_support");setPriority("medium");
      await load();
    } catch(e) {setError(e instanceof Error?e.message:"Unable to submit your support request.");}
    finally {setSubmitting(false);}
  }

  return <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-background)] px-4 py-7 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/businesses/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft size={16}/> Back to Business Dashboard</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-[var(--color-primary)]">We&apos;re here to help</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">Business Support</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{business ? "Support for " + business.business_name : "Get help with your Twimzi business profile."}</p></div>
          <button onClick={()=>void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"><RefreshCw size={16}/> Refresh requests</button>
        </div>
      </div>
      {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}{error.toLowerCase().includes("sign in")?<Link href="/login?next=/businesses/dashboard/support" className="ml-2 font-bold underline">Sign in</Link>:null}</div>:null}
      {success?<div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{success}</div>:null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"><Headset size={22}/></div><div><h2 className="text-xl font-bold text-[var(--color-text)]">Raise a support request</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Our team will review your request and update its status here.</p></div></div>
          {loading&&!business?<div className="py-10 text-center text-sm text-[var(--color-text-secondary)]">Loading business profile…</div>:<form onSubmit={submit} className="space-y-5">
            <div className="rounded-xl bg-[var(--color-background)] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Business</p><p className="mt-1 text-sm font-bold text-[var(--color-text)]">{business?.business_name||"Your business"}</p>{userEmail?<p className="mt-1 text-xs text-[var(--color-text-secondary)]">{userEmail}</p>:null}</div>
            <label className="block"><span className="text-sm font-semibold text-[var(--color-text)]">Subject</span><input required maxLength={200} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Unable to update business profile" className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" disabled={!business||submitting}/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-semibold text-[var(--color-text)]">Category</span><select value={category} onChange={e=>setCategory(e.target.value as Category)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm" disabled={submitting}><option value="business_support">Business Support</option><option value="general">General Support</option><option value="feedback">Feedback</option><option value="grievance">Grievance / Complaint</option></select></label>
              <label className="block"><span className="text-sm font-semibold text-[var(--color-text)]">Priority</span><select value={priority} onChange={e=>setPriority(e.target.value as Priority)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm" disabled={submitting}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            </div>
            <label className="block"><span className="text-sm font-semibold text-[var(--color-text)]">Describe the issue</span><textarea required rows={7} maxLength={10000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell us what happened and how we can help…" className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" disabled={!business||submitting}/><span className="mt-1 block text-xs text-[var(--color-text-secondary)]">Maximum 10,000 characters.</span></label>
            <button type="submit" disabled={!business||submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"><Send size={16}/>{submitting?"Submitting request…":"Submit Support Request"}</button>
          </form>}
        </section>
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[var(--color-text)]">Your support requests</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Track replies and progress.</p></div><span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[var(--color-primary-dark)]">{tickets.length}</span></div>
          {loading?<p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">Loading requests…</p>:tickets.length===0?<div className="rounded-xl bg-[var(--color-background)] px-5 py-10 text-center"><MessageSquareText size={28} className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No support requests yet</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Your submitted requests will appear here.</p></div>:<div className="max-h-[720px] space-y-3 overflow-y-auto">{tickets.map(ticket=><article key={ticket.id} className="rounded-xl border border-[var(--color-border)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-[var(--color-primary)]">{ticket.ticket_number}</span><span className={"rounded-full px-2.5 py-1 text-[10px] font-bold "+statusClass(ticket.status)}>{statuses[ticket.status]||ticket.status}</span></div><h3 className="mt-2 font-bold text-[var(--color-text)]">{ticket.subject}</h3><p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">{ticket.description}</p><div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><Clock3 size={13}/>{formatDate(ticket.created_at)}<span>·</span>{ticket.priority.toUpperCase()} priority</div>{ticket.resolution?<div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><strong>Team update:</strong> {ticket.resolution}</div>:null}</article>)}</div>}
        </section>
      </div>
    </div>
  </main>;
}
