import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Data Deletion & Retention Policy | Twimzi",
  description: "Find how to request deletion of your Twimzi account and personal data, including the process, exceptions and information retention details."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="data_deletion_policy"
      title="Data Deletion & Retention Policy"
    />
  );
}