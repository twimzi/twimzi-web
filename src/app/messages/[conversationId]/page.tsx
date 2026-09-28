import type { Metadata } from "next";

import { ChatWindow } from "@/components/messaging/chat-window";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Conversation | Twimzi",
  description: "Twimzi messages and conversations.",
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ChatWindow conversationId={conversationId} />
      </div>
    </main>
  );
}