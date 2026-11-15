import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Intellectual Property Policy | Twimzi",
  description: "Learn how Twimzi handles copyright and trademark concerns, and how rights holders can report potentially infringing content."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="intellectual_property_policy"
      title="Intellectual Property Policy"
    />
  );
}