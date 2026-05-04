import { config } from "dotenv";
config({ path: ".dev.vars" });

const baseUrl = process.env.ZULIP_URL || "https://aresfirst.zulipchat.com";
const credentials = `${process.env.ZULIP_BOT_EMAIL}:${process.env.ZULIP_API_KEY}`;
const authHeader = "Basic " + btoa(unescape(encodeURIComponent(credentials)));

async function test() {
  const params = new URLSearchParams();
  params.append("invitee_emails", "test@test.com");
  params.append("stream_ids", JSON.stringify([]));
  params.append("invite_as", "400");
  
  const res = await fetch(`${baseUrl}/api/v1/invites`, {
    method: "POST",
    headers: { 
      "Authorization": authHeader,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}

test();
