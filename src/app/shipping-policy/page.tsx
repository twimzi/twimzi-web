import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Shipping & Delivery Policy | Twimzi",
  description: "Review the Twimzi shipping and delivery policy and understand the responsibilities that apply to listings and transactions on the platform."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="shipping_policy"
      title="Shipping & Delivery Policy"
    />
  );
}