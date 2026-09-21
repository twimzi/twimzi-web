import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Shipping & Delivery Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="shipping_policy"
      title="Shipping & Delivery Policy"
    />
  );
}