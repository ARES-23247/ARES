async function testSignIn() {
    console.log("Sending POST to /api/auth/sign-in/social...");
    const res = await fetch("http://127.0.0.1:8788/api/auth/sign-in/social", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            provider: "google",
            callbackURL: "/dashboard"
        })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    try {
        console.log("Body JSON:", JSON.parse(text));
    } catch {
        console.log("Body Text:", text);
    }
}

testSignIn().catch(console.error);
