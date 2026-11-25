import Image from "next/image";
import { ConversationList } from "@/components/messaging/conversation-list";

export const metadata = {
  title: "Messages | Twimzi",
  description: "View and manage your Twimzi conversations.",
};

export default function MessagesPage() {
  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_rgba(142,7,251,0.12),_transparent_38%),radial-gradient(ellipse_at_bottom_right,_rgba(5,205,252,0.13),_transparent_36%),linear-gradient(135deg,#F6F8FA_0%,#E8F7F4_52%,#FFF7F0_100%)] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#0D9488]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-[#F97316]/15 blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-6 overflow-hidden rounded-[1.7rem] bg-[linear-gradient(115deg,#14243D_0%,#087F75_58%,#0D9488_100%)] p-6 text-white shadow-[0_22px_55px_rgba(2,13,58,0.17)] sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <Image src="/twimzi-logo.png" alt="Twimzi logo" width={769} height={650} priority className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-200">Stay connected</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your messages</h1>
              <p className="mt-1 text-sm text-teal-100">Conversations with businesses and people across Twimzi.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Business enquiries</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Direct conversations</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Stay in the loop</span>
          </div>
        </div>
        <ConversationList />
      </div>
    </main>
  );
}
