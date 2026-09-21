import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Intellectual Property Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="intellectual_property_policy"
      title="Intellectual Property Policy"
    />
  );
}