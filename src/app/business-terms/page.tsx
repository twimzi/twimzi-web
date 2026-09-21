import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Business Terms | Twimzi",
  description: "Twimzi Business Terms.",
};

export default function BusinessTermsPage() {
  return (
    <LegalDocumentPage
      documentType="business_terms"
      title="Business Terms"
    />
  );
}