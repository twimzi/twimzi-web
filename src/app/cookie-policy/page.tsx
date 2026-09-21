import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Cookie Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="cookie_policy"
      title="Cookie Policy"
    />
  );
}