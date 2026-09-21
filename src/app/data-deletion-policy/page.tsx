import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Data Deletion & Retention Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="data_deletion_policy"
      title="Data Deletion & Retention Policy"
    />
  );
}