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
  const ctaLabel = template.ctaLabel;
  const rawUrl = resolveTokens(template.ctaUrl, payload, name || "there");
  const safeUrl = /^https:\/\//i.test(rawUrl) ? rawUrl : "https://www.twimzi.com";
  const paragraphs = body.split(/\n\n+/).map((paragraph) => {
    const lines = paragraph.split("\n");
    const isList = lines.every((line) => line.trim().startsWith("•"));
    if (isList) {
      return "<ul style=\"margin:0 0 20px;padding-left:22px;color:#475569;line-height:1.8\">" +
        lines.map((line) => "<li>" + escapeHtml(line.replace(/^\s*•\s*/, "")) + "</li>").join("") + "</ul>";
    }
    return "<p style=\"margin:0 0 18px;color:#475569;font-size:15px;line-height:1.8\">" +
      lines.map(escapeHtml).join("<br>") + "</p>";
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(template.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden"><tr><td style="background:#0d9488;padding:24px 32px"><a href="https://www.twimzi.com" style="font-size:25px;font-weight:800;letter-spacing:-.5px;color:#ffffff;text-decoration:none">twimzi</a><div style="margin-top:5px;color:#d9fffb;font-size:12px;letter-spacing:1.2px;text-transform:uppercase">Discover. Connect. Grow.</div></td></tr><tr><td style="padding:34px 32px 28px"><h1 style="margin:0 0 22px;color:#0f172a;font-size:23px;line-height:1.3">${escapeHtml(subject)}</h1>${paragraphs}<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 24px"><tr><td bgcolor="#0d9488" style="border-radius:9px"><a href="${escapeHtml(safeUrl)}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(ctaLabel)}</a></td></tr></table><p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Need help? Visit <a href="https://www.twimzi.com" style="color:#0d9488;text-decoration:none">twimzi.com</a>.</p></td></tr><tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px"><p style="margin:0;color:#64748b;font-size:12px;line-height:1.7">You are receiving this service email because of activity related to your Twimzi account or business listing. This is a transactional notification, not a marketing subscription.</p><p style="margin:10px 0 0;color:#94a3b8;font-size:11px">© ${new Date().getFullYear()} Twimzi · <a href="https://www.twimzi.com" style="color:#0d9488;text-decoration:none">www.twimzi.com</a></p></td></tr></table></td></tr></table></body></html>`;
  return { subject, body, html };
}
