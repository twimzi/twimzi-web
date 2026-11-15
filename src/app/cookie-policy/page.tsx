import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Cookie Policy | Twimzi",
  description: "Learn how Twimzi uses cookies and similar technologies to support website functionality, improve user experience and understand site usage."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="cookie_policy"
      title="Cookie Policy"
    />
  );
}