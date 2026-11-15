import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Refund & Cancellation Policy | Twimzi",
  description: "Review the Twimzi refund and cancellation policy, including applicable services, eligibility conditions and how to contact support."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="refund_policy"
      title="Refund & Cancellation Policy"
    />
  );
}