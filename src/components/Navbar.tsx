import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-marble/95 backdrop-blur-md meander-border shadow-sm p-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-ares-red flex items-center gap-2 font-heading">
          ARES <span className="text-ares-bronze font-bold">23247</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
          <Link to="/" className="text-ares-red hover:text-ares-bronze transition-colors">Home</Link>
          <Link to="/about" className="text-obsidian/70 hover:text-ares-red transition-colors">About</Link>
          <Link to="/seasons" className="text-obsidian/70 hover:text-ares-red transition-colors">Seasons</Link>
          <Link to="/outreach" className="text-obsidian/70 hover:text-ares-red transition-colors">Outreach</Link>
          <Link to="/events" className="text-obsidian/70 hover:text-ares-red transition-colors">Events</Link>
          <Link to="/blog" className="text-obsidian/70 hover:text-ares-red transition-colors">Blog</Link>
        </div>

        <div className="hidden md:block">
          <Link to="/contact" className="clipped-button-sm bg-ares-red text-white hover:bg-ares-bronze transition-all shadow-md">
            Support Us
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-ares-red w-8 h-8 flex flex-col justify-center items-center gap-1.5 focus:outline-none">
          <span className={`w-6 h-0.5 bg-current block transition-transform duration-300 ${open ? "rotate-45 translate-y-2" : ""}`}></span>
          <span className={`w-6 h-0.5 bg-current block transition-opacity duration-300 ${open ? "opacity-0" : ""}`}></span>
          <span className={`w-6 h-0.5 bg-current block transition-transform duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`}></span>
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-4 flex flex-col gap-4 text-sm font-bold uppercase tracking-widest px-2 pb-4 border-t border-ares-bronze/10 pt-4 bg-marble">
          <Link to="/" onClick={() => setOpen(false)} className="text-ares-red">Home</Link>
          <Link to="/about" onClick={() => setOpen(false)} className="text-obsidian/70">About</Link>
          <Link to="/seasons" onClick={() => setOpen(false)} className="text-obsidian/70">Seasons</Link>
          <Link to="/outreach" onClick={() => setOpen(false)} className="text-obsidian/70">Outreach</Link>
          <Link to="/events" onClick={() => setOpen(false)} className="text-obsidian/70">Events</Link>
          <Link to="/blog" onClick={() => setOpen(false)} className="text-obsidian/70">Blog</Link>
          <Link to="/contact" onClick={() => setOpen(false)} className="text-obsidian/70">Contact</Link>
        </div>
      )}
    </nav>
  );
}
