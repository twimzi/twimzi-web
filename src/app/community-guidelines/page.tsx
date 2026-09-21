import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Community Guidelines | Twimzi",
  description: "Twimzi Community Guidelines.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalDocumentPage
      documentType="community_guidelines"
      title="Community Guidelines"
    />
  );
}