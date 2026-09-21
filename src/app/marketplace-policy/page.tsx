import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Marketplace & Listing Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="marketplace_policy"
      title="Marketplace & Listing Policy"
    />
  );
}