import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Marketplace & Listing Policy | Twimzi",
  description: "Understand the rules for business listings, products, services and offers published on Twimzi, including content quality and business responsibilities."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="marketplace_policy"
      title="Marketplace & Listing Policy"
    />
  );
}