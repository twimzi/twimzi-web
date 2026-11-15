import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Terms & Conditions | Twimzi",
  description: "Read the terms governing access to and use of Twimzi, including accounts, business listings, user responsibilities and platform limitations.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalDocumentPage
      documentType="terms_of_service"
      title="Terms & Conditions"
    />
  );
}