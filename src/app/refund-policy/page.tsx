import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Refund & Cancellation Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="refund_policy"
      title="Refund & Cancellation Policy"
    />
  );
}