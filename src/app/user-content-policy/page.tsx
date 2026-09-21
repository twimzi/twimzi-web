import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "User Content Policy | Twimzi",
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="user_content_policy"
      title="User Content Policy"
    />
  );
}