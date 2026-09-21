import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Platform Disclaimer | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="disclaimer"
      title="Platform Disclaimer"
    />
  );
}