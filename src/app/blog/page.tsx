import { getRequestContext } from "@cloudflare/next-on-pages";
import Image from "next/image";
import Link from "next/link";

export const runtime = "edge";

interface PostRecord {
  slug: string;
  title: string;
  date: string;
  snippet: string;
  thumbnail: string;
}

export default async function BlogIndexPage() {
  let posts: PostRecord[] = [];
  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare(
      "SELECT slug, title, date, snippet, thumbnail FROM posts"
    ).all<PostRecord>();
    posts = results;
  } catch (err) {
    console.error("Local D1 might not be instantiated during build", err);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <h3 className="text-ares-cyan font-bold uppercase tracking-widest text-sm mb-2">Engineering & Outreach</h3>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter shadow-sm">
          Team <span className="text-ares-red">Blog</span>
        </h1>
        <p className="text-white/60 mt-4 max-w-2xl text-balance">
          Read deep dives into our codebase, mechanical design process, and reflections on our outreach events.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
            <div className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(220,38,38,0.15)] flex flex-col h-full border border-white/10 group-hover:border-ares-red/30">
              <div className="relative h-56 w-full overflow-hidden">
                <Image src={post.thumbnail} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <p className="text-xs text-white/50 mb-2">{post.date}</p>
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-ares-red transition-colors">{post.title}</h4>
                <p className="text-sm text-white/60 line-clamp-3">{post.snippet}</p>
              </div>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="text-white/50 p-6 glass-card rounded-2xl col-span-full border-dashed">
            No posts found or local D1 is uninitialized.
          </div>
        )}
      </div>
    </div>
  );
}
