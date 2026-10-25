/**
 * Legal details shown in the privacy policy, terms and consent screens. Set the
 * NEXT_PUBLIC_LEGAL_* variables for production; the versions must match the API's
 * PRIVACY_POLICY_VERSION / TERMS_VERSION so recorded consents point at the right text.
 */
export const LEGAL = {
  product: "PigMaster",
  entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "PigMaster",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "Nairobi, Kenya",
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  privacyVersion: process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION || "2026-10-25",
  termsVersion: process.env.NEXT_PUBLIC_TERMS_VERSION || "2026-10-25",
};

export const contactLine = () =>
  [LEGAL.privacyEmail && `email ${LEGAL.privacyEmail}`, LEGAL.whatsapp && `WhatsApp +${LEGAL.whatsapp.replace(/^\+/, "")}`]
    .filter(Boolean)
    .join(" or ") || "use the support button in the app";
