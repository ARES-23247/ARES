import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-ares-red">
        <div className="absolute inset-0 bg-gradient-to-b from-ares-red via-ares-red to-background"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20 pb-16 flex flex-col items-center text-center">
          <p className="text-white font-bold uppercase tracking-[0.3em] text-sm mb-6">
            Appalachian Robotics &amp; Engineering Society
          </p>

          <h1 className="text-[8rem] md:text-[14rem] font-black text-ares-gold leading-none tracking-[0.05em] uppercase drop-shadow-2xl mb-2">
            ARES
          </h1>

          <p className="text-white text-2xl md:text-4xl italic font-light mb-2">
            <span className="not-italic font-bold">FIRST</span> Tech Challenge Team #23247
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm font-semibold uppercase tracking-wider">
              2025/26 — Our Rookie Season
            </span>
            <a href="https://www.marsfirst.org" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm font-semibold uppercase tracking-wider hover:bg-white/20 transition-colors underline">
              Member of the MARS Family
            </a>
          </div>
        </div>
      </section>

      {/* ─── WHO WE ARE ─── */}
      <section className="py-24 bg-white text-ares-gray">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-ares-gray uppercase tracking-widest text-sm font-bold mb-2">Who We Are</p>
            <h2 className="text-4xl md:text-5xl font-black text-ares-red leading-tight mb-6">
              Appalachian Robotics and Engineering Society
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              We are a community-based <em>FIRST</em> Tech Challenge (FTC) team. We show <em>FIRST</em>&apos;s impact in our state. We show how West Virginia&apos;s students from different schools can work together to achieve something great.
            </p>
            <p>
              ARES is part of a strong robotics history in North Central West Virginia. We are part of the Mountaineer Area RoboticS (<em>MARS</em>) #2614 family. ARES is building on MARS&apos;s Hall of Fame history. MARS is West Virginia&apos;s leading FIRST Robotics Competition team.
            </p>
            <p>
              2025 is our rookie year. However, we are backed by a team that has already reached the top of <em>FIRST</em> robotics.
            </p>
          </div>
        </div>
      </section>

      {/* ─── OUTREACH CARDS ─── */}
      <section className="py-24 bg-ares-gold">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-ares-red text-center mb-4">Outreach</h2>
          <p className="text-center text-ares-gray mb-16 max-w-2xl mx-auto">
            Learn more about our team and how you can get involved.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Future Team Members",
                body: "Learn more about our team and what to expect as a team member in FIRST Tech Challenge and then if it looks like a fit, reach out. We can&apos;t wait to meet you.",
                link: "/about",
                linkText: "Learn More →",
              },
              {
                title: "Local Community",
                body: "We&apos;re looking for opportunities to connect in north-central West Virginia. If you have a volunteer need or idea for our team, get in touch.",
                link: "/contact",
                linkText: "Contact Us →",
              },
              {
                title: "STEAM Community",
                body: "We need your help! You can join our team as a mentor, or give tours of your labs and show us robotics in use. You can also sponsor us through tax-deductible donations.",
                link: "/contact",
                linkText: "Support Us →",
              },
            ].map((card) => (
              <div key={card.title} className="bg-ares-red rounded-2xl p-8 flex flex-col h-full shadow-xl hover:shadow-2xl transition-shadow duration-300 group">
                <h3 className="text-ares-gold text-xl font-bold mb-4 group-hover:underline">{card.title}</h3>
                <p className="text-white/90 text-base leading-relaxed flex-grow">{card.body}</p>
                <Link to={card.link} className="mt-6 inline-block text-ares-gold font-bold text-sm hover:text-white transition-colors">
                  {card.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STRONG FIRST CULTURE ─── */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
            Strong <em className="text-ares-gold not-italic">FIRST</em> Culture
          </h2>
          <div className="space-y-6 text-lg leading-relaxed text-white/80">
            <p>
              North-Central West Virginia has the strongest <em>FIRST</em> culture in the state.
            </p>
            <p>
              Morgantown is home to Mountaineer Area RoboticS (MARS). MARS is the leading <em>FIRST</em> Robotics Competition (FRC) team in West Virginia. They are an internationally recognized team with many awards. MARS also hosts <em>FIRST</em> LEGO League (FLL) competitions and starts new local teams.
            </p>
            <p>
              <em>FIRST</em> programs are the best way for students to learn technical skills. Students learn robotics skills like programming, building, and design. They also learn other great skills like video making and digital art!
            </p>
            <p className="text-white/50 text-sm italic">
              Photo: All members of the RoboCookies 2025 FLL team are sisters of MARS/ARES team members.
            </p>
          </div>
        </div>
      </section>

      {/* ─── OUTREACH CALENDAR BANNER ─── */}
      <section className="py-16 bg-ares-red">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-ares-gold text-3xl font-bold mb-4">Outreach Calendar</h3>
          <p className="text-white/90 max-w-xl mx-auto mb-6">
            Follow our outreach calendar to see upcoming demos, community events, and workshops.
          </p>
          <a
            href="https://calendar.google.com/calendar/u/0/embed?src=af2d297c3425adaeafc13ddd48a582056404cbf16a6156d3925bb8f3b4affaa0@group.calendar.google.com&ctz=America/New_York"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-ares-gold text-ares-red font-bold rounded-lg hover:bg-white transition-colors"
          >
            View Calendar
          </a>
        </div>
      </section>
    </div>
  );
}
