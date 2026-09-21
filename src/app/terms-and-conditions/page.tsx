import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Terms & Conditions | Twimzi",
  description: "Twimzi Terms of Service.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalDocumentPage
      documentType="terms_of_service"
      title="Terms & Conditions"
    />
  );
}