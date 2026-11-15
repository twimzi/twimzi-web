import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "User Content Policy | Twimzi",
  description: "Understand the standards for photos, videos, posts, stories and other user-submitted content published across Twimzi."
};

export default function Page() {
  return (
    <LegalDocumentPage
      documentType="user_content_policy"
      title="User Content Policy"
    />
  );
}