const fs = require('fs');
let content = fs.readFileSync('functions/api/routes/ai/index.ts', 'utf8');

const ragOld = `      if (hasZai) {
        console.log("[RAG] Using z.ai (GLM-5.1) - Z_AI_API_KEY present");
        await stream.writeSSE({ data: JSON.stringify({ model: "GLM-5.1" }) });
        const zaiRes = await fetch("https://api.z.ai/api/coding/paas/v4/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${c.env.Z_AI_API_KEY}\`
          },
          body: JSON.stringify({
            model: "GLM-5.1",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages
            ],
            stream: true,
            max_tokens: 4096
          })
        });

        if (zaiRes.ok && zaiRes.body) {
          const reader = zaiRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    accumulatedText += data.choices[0].delta.content;
                    await stream.writeSSE({ data: JSON.stringify({ chunk: data.choices[0].delta.content }) });
                  }
                } catch (_e) { /* ignore */ }
              }
            }
          }

          // z.ai succeeded — save history and return
          await saveHistory(db, sessionId, historyMessages, safeQuery, accumulatedText);
          return;
        } else {
          const errBody = await zaiRes.text().catch(() => "");
          console.error("[RAG] z.ai error, falling back to Workers AI:", zaiRes.status, errBody);
        }
      }`;

const ragNew = `      if (hasZai) {
        console.log("[RAG] Using z.ai (GLM-5.1) - Z_AI_API_KEY present");
        await stream.writeSSE({ data: JSON.stringify({ model: "GLM-5.1" }) });
        try {
          const zaiRes = await fetch("https://api.z.ai/api/coding/paas/v4/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": \`Bearer \${c.env.Z_AI_API_KEY}\`
            },
            body: JSON.stringify({
              model: "GLM-5.1",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages
              ],
              stream: true,
              max_tokens: 4096
            })
          });

          const contentType = zaiRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errData = await zaiRes.json();
            throw new Error(errData.error?.message || JSON.stringify(errData));
          }

          if (!zaiRes.ok) throw new Error(await zaiRes.text());

          if (zaiRes.body) {
            const reader = zaiRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === "[DONE]") continue;
                  try {
                    const data = JSON.parse(dataStr);
                    if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                      accumulatedText += data.choices[0].delta.content;
                      await stream.writeSSE({ data: JSON.stringify({ chunk: data.choices[0].delta.content }) });
                    }
                  } catch (_e) { /* ignore */ }
                }
              }
            }

            // z.ai succeeded — save history and return
            await saveHistory(db, sessionId, historyMessages, safeQuery, accumulatedText);
            return;
          }
        } catch (zaiErr) {
          console.error("[RAG] z.ai error, falling back to Workers AI:", zaiErr);
        }
      }`;

if (content.includes(ragOld)) {
  content = content.replace(ragOld, ragNew);
  console.log("RAG updated");
} else {
  console.log("RAG not found or already updated");
}


fs.writeFileSync('functions/api/routes/ai/index.ts', content);
