const secret = process.env.EMAIL_AUTOMATION_CRON_SECRET;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.twimzi.com").replace(/\/$/, "");

if (!secret) {
  console.error("EMAIL_AUTOMATION_CRON_SECRET is missing from the cron job environment.");
  process.exit(1);
}

try {
  const response = await fetch(siteUrl + "/api/cron/email-automation", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secret,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const responseText = await response.text();
  console.log("Twimzi email automation:", response.status, response.ok ? "OK" : "FAILED");
  if (responseText) {
    try {
      const result = JSON.parse(responseText);
      console.log(JSON.stringify(result));
    } catch {
      console.log(responseText.slice(0, 1000));
    }
  }
  if (!response.ok) process.exit(1);
} catch (error) {
  console.error("Twimzi email automation request failed:", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
}
