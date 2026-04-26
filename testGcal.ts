import { pushEventToGcal } from "./functions/utils/gcalSync";

async function run() {
  // get creds from DB or pass hardcoded if possible, but let's query DB
  const dbConfig = {
    email: "ares-bot@aresweb-integrations.iam.gserviceaccount.com",
    privateKey: "placeholder",
    calendarId: "ares23247wv@gmail.com"
  };

  try {
    const res = await pushEventToGcal(
      { id: "test-123", title: "Test Event", date_start: "2026-05-01" },
      dbConfig
    );
    console.log("Success:", res);
  } catch (err) {
    console.error("Failed:", err);
  }
}
run();
