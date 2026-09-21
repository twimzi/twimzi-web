import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Acceptable Use Policy | Twimzi",
  description: "Twimzi Acceptable Use Policy.",
};

export default function AcceptableUsePage() {
  return (
    <LegalDocumentPage
      documentType="acceptable_use_policy"
      title="Acceptable Use Policy"
    />
  );
}