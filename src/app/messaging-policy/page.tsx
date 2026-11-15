import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Messaging & Communication Policy | Twimzi",
  description: "Read the Twimzi messaging policy for appropriate business communications, user consent, unwanted messages and reporting concerns.",
};

export default function MessagingPolicyPage() {
  return (
    <LegalDocumentPage
      documentType="messaging_policy"
      title="Messaging & Communication Policy"
    />
  );
}