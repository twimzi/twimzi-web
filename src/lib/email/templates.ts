export type EmailTemplate = {
  id: string;
  label: string;
  category: string;
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  preheader: string;
};

export const EMAIL_TEMPLATE_LIBRARY: EmailTemplate[] = [
  {
    id: "register_business_invitation",
    label: "Register your business on Twimzi",
    category: "Business acquisition",
    subject: "Give your business a place to grow online with Twimzi",
    preheader: "Create your free business listing and help more customers discover you.",
    body: "Hello {{name}},\n\nAre you looking for a simple way to showcase your business online? Join Twimzi and create your business listing so customers can discover what you offer.\n\nWith your Twimzi business profile, you can:\n• Showcase your business, products and services\n• Add photos and important contact information\n• Help nearby customers find and connect with you\n• Keep your business information updated in one place\n\nGetting started is simple. Register your business on Twimzi and take the first step towards building your online presence.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Register your business",
    ctaUrl: "{{register_url}}",
  },
  {
    id: "business_welcome",
    label: "Welcome new business",
    category: "Business onboarding",
    subject: "Welcome to Twimzi — let’s put your business in the spotlight",
    preheader: "Your business is now part of the Twimzi community.",
    body: "Hello {{name}},\n\nWelcome to Twimzi! We’re glad to have {{business_name}} with us. Twimzi helps people discover local businesses, products and services.\n\nMake the most of your listing:\n• Complete your business information\n• Add clear photos, products and services\n• Share your Twimzi profile with customers\n\nYour business journey starts here. We’re excited to help more people discover what you do.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Complete your business profile",
    ctaUrl: "{{business_url}}",
  },
  {
    id: "profile_reminder",
    label: "Complete your business profile",
    category: "Business activation",
    subject: "A few details can make your Twimzi profile work harder",
    preheader: "Finish your profile so customers can understand your business.",
    body: "Hello {{name}},\n\nYour Twimzi business profile for {{business_name}} is not complete yet. Adding the right information helps customers understand what you offer and how to reach you.\n\nConsider adding your business description, contact details, opening hours, photos, products and services.\n\nIt only takes a few minutes to make your profile more useful.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Finish your profile",
    ctaUrl: "{{business_url}}",
  },
  {
    id: "business_approved",
    label: "Business listing approved",
    category: "Business status",
    subject: "Your Twimzi business listing is approved",
    preheader: "Your business listing is ready to be discovered.",
    body: "Hello {{name}},\n\nGood news — your business listing for {{business_name}} has been approved on Twimzi. Your profile is ready for customers to explore.\n\nYou can now review your details, add products and services, and share your listing with your customers.\n\nThank you for being part of Twimzi.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "View your business",
    ctaUrl: "{{business_url}}",
  },
  {
    id: "business_claim_invitation",
    label: "Claim your business",
    category: "Business acquisition",
    subject: "Is this your business? Claim it on Twimzi",
    preheader: "Take control of your business information on Twimzi.",
    body: "Hello {{name}},\n\nWe found a business listing for {{business_name}} on Twimzi. If you own or manage this business, you can claim the listing and manage the information shown to customers.\n\nKeep your details accurate, showcase your products and services, and help customers connect with you.\n\nIf you are not associated with this business, please ignore this email.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Review business listing",
    ctaUrl: "{{claim_url}}",
  },
  {
    id: "new_enquiry",
    label: "New customer enquiry",
    category: "Business engagement",
    subject: "You have a new customer enquiry on Twimzi",
    preheader: "A customer has shown interest in your business.",
    body: "Hello {{name}},\n\nYou have received a new enquiry for {{business_name}} through Twimzi.\n\nPlease review the enquiry and respond promptly so the customer can get the information they need.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "View enquiry",
    ctaUrl: "{{enquiry_url}}",
  },
  {
    id: "support_received",
    label: "Support request received",
    category: "Customer support",
    subject: "We’ve received your message — Twimzi Support",
    preheader: "Your support request is safely with our team.",
    body: "Hello {{name}},\n\nThank you for contacting Twimzi Support. We have received your request{{ticket_reference}} and our team will review it.\n\nIf you need to add more information, reply to this email and include your reference number.\n\nRegards,\nTwimzi Support",
    ctaLabel: "Visit Twimzi",
    ctaUrl: "https://www.twimzi.com",
  },
  {
    id: "account_security",
    label: "Account security notice",
    category: "Account & security",
    subject: "Important security notice for your Twimzi account",
    preheader: "A security-related change was made to your account.",
    body: "Hello {{name}},\n\nThis is a security notification about your Twimzi account: {{security_event}}.\n\nIf you recognise this activity, no action is needed. If you do not recognise it, secure your account and contact Twimzi Support.\n\nFor your protection, Twimzi will never ask you to share your password or one-time verification code by email.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Open Twimzi",
    ctaUrl: "https://www.twimzi.com",
  },
  {
    id: "business_update",
    label: "Business profile update",
    category: "Business engagement",
    subject: "Your Twimzi business profile has been updated",
    preheader: "Your latest business information is now saved.",
    body: "Hello {{name}},\n\nThe business profile for {{business_name}} has been updated on Twimzi. Please review the latest information to make sure everything is accurate.\n\nThank you for keeping your listing up to date.\n\nRegards,\nTeam Twimzi",
    ctaLabel: "Review your profile",
    ctaUrl: "{{business_url}}",
  },
];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character] || character);
}

function resolveTokens(value: string, payload: Record<string, unknown>, name: string) {
  const values: Record<string, string> = {
    name,
    register_url: String(payload.register_url || "https://www.twimzi.com/add-business"),
    business_name: String(payload.business_name || "your business"),
    business_url: String(payload.business_url || "https://www.twimzi.com"),
    claim_url: String(payload.claim_url || "https://www.twimzi.com"),
    enquiry_url: String(payload.enquiry_url || "https://www.twimzi.com"),
    ticket_reference: payload.ticket_reference ? " (reference " + String(payload.ticket_reference) + ")" : "",
    security_event: String(payload.security_event || "Your account details were updated."),
  };
  return value.replace(/\{\{([a-z_]+)\}\}/g, (_match, key: string) => values[key] ?? "");
}

export function renderEmailTemplate(templateKey: string, name: string, payload: Record<string, unknown>) {
  const template = EMAIL_TEMPLATE_LIBRARY.find((item) => item.id === templateKey);
  if (!template) throw new Error("Unknown email automation template.");
  const subject = resolveTokens(template.subject, payload, name || "there");
  const body = resolveTokens(template.body, payload, name || "there");
  const rawUrl = resolveTokens(template.ctaUrl, payload, name || "there");
  let safeUrl = "https://www.twimzi.com";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:" && (parsed.hostname === "twimzi.com" || parsed.hostname === "www.twimzi.com")) safeUrl = parsed.toString();
  } catch { /* Keep the safe Twimzi fallback URL. */ }
  const paragraphs = body.split("\n\n").map((paragraph) => {
    const lines = paragraph.split("\n");
    const isList = lines.every((line) => line.trim().startsWith("•"));
    if (isList) return "<ul style=\"margin:0 0 20px;padding-left:22px;color:#475569;font-size:15px;line-height:1.85\">" +
      lines.map((line) => "<li style=\"padding:2px 0\">" + escapeHtml(line.replace(/^\s*•\s*/, "")) + "</li>").join("") + "</ul>";
    return "<p style=\"margin:0 0 18px;color:#475569;font-size:15px;line-height:1.85\">" +
      lines.map(escapeHtml).join("<br>") + "</p>";
  }).join("");
  const logo = "https://www.twimzi.com/twimzi-logo.png";
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>' + escapeHtml(subject) + '</title></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">' + escapeHtml(template.preheader) + '</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border-radius:18px;overflow:hidden"><tr><td align="center" style="padding:22px 28px;background:#fff;border-bottom:1px solid #e2e8f0"><a href="https://www.twimzi.com"><img src="' + logo + '" width="156" alt="Twimzi" style="display:block;width:156px;max-width:60%;height:auto;border:0"></a></td></tr><tr><td style="padding:27px 32px 29px;background:#0d9488"><p style="margin:0 0 9px;color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:1.8px">DISCOVER · CONNECT · GROW</p><h1 style="margin:0;color:#fff;font-size:25px;line-height:1.3">' + escapeHtml(subject) + '</h1></td></tr><tr><td style="padding:32px">' + paragraphs + '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 26px"><tr><td bgcolor="#0d9488" style="border-radius:10px"><a href="' + escapeHtml(safeUrl) + '" style="display:inline-block;padding:15px 25px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px">' + escapeHtml(template.ctaLabel) + '</a></td></tr></table><p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.7">Need help? Visit <a href="https://www.twimzi.com" style="color:#0d9488">Twimzi.com</a>.</p></td></tr><tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e2e8f0"><p style="margin:0 0 8px;color:#334155;font-size:12px;font-weight:700">Twimzi — Digital Operating System for Every Local Business</p><p style="margin:0;color:#64748b;font-size:11px;line-height:1.7">You are receiving this service email because of activity related to your Twimzi account or business listing. This is a transactional notification, not a marketing subscription.</p><p style="margin:12px 0 0;color:#94a3b8;font-size:11px">© ' + new Date().getFullYear() + ' Twimzi · <a href="https://www.twimzi.com" style="color:#0d9488">www.twimzi.com</a></p></td></tr></table></td></tr></table></body></html>';
  return { subject, body, html };
}
