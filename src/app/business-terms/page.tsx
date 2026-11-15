import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Business Terms | Twimzi",
  description: "Review the terms for businesses using Twimzi to create profiles, publish listings, showcase products and services, and connect with customers.",
};

export default function BusinessTermsPage() {
  return (
    <LegalDocumentPage
      documentType="business_terms"
      title="Business Terms"
    />
  );
}