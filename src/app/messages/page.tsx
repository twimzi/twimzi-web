import { ConversationList } from "@/components/messaging/conversation-list";

export const metadata = {
  title: "Messages | Twimzi",
  description: "View and manage your Twimzi conversations.",
};

export default function MessagesPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ConversationList />
      </div>
    </main>
  );
}