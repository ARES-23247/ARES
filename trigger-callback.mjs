import fetch from "node-fetch";

async function test() {
    try {
        console.log("Fetching /api/auth/callback/google...");
        const res = await fetch("http://127.0.0.1:8788/api/auth/callback/google?state=fake_state&code=fake_code", {
            redirect: "manual"
        });
        
        console.log(`Status: ${res.status}`);
        console.log("Headers:", res.headers.raw());
        const bodyTxt = await res.text();
        console.log("Body length:", bodyTxt.length);
        if (bodyTxt.length < 500) console.log("Body:", bodyTxt);
    } catch (e) {
        console.error(e);
    }
}
test();
