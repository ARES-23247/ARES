import { BskyAgent, RichText } from '@atproto/api';

async function main() {
    try {
        const agent = new BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: 'ares23247.bsky.social',
            password: 'pauh-iafq-yr62-h2wh',
        });
        console.log("Logged in successfully!");

        const rt = new RichText({
            text: `🔧 Developer test: Running diagnostic check on the ARES syndication pipeline.`
        });
        await rt.detectFacets(agent);

        const res = await agent.post({
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString()
        });
        console.log("Post response:", res);

    } catch (e) {
        console.error("FAILED:");
        console.error(e);
    }
}
main();
