import LegalDocumentPage from "@/components/legal/legal-document-page";

export const metadata = {
  title: "Community Guidelines | Twimzi",
  description: "Understand Twimzi community standards for respectful interactions, accurate business information and safe participation across the platform.",
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalDocumentPage
      documentType="community_guidelines"
      title="Community Guidelines"
    />
  );
}