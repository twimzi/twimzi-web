import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Messaging & Communication Policy | Twimzi",
  description: "Twimzi Messaging & Communication Policy.",
};

export default function MessagingPolicyPage() {
  return (
    <LegalDocumentPage
      documentType="messaging_policy"
      title="Messaging & Communication Policy"
    />
  );
}