import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GreekMeander } from "./GreekMeander";
import { siteConfig } from "../site.config";
import { Mail, Box, Hexagon, Trophy } from "lucide-react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <footer role="contentinfo" aria-label="Site Footer" className="w-full bg-obsidian text-marble border-t border-ares-bronze/20 pt-12 pb-6 overflow-hidden relative">
      {/* Meander accent for footer bottom */}
      <GreekMeander variant="thin" opacity="opacity-40" className="absolute bottom-0 left-0" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10">
        {/* Brand & Mission */}
        <div className="md:col-span-2">
          <div className="mb-6">
            <Link to="/" className="block text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ares-cyan rounded px-1 w-fit">
              <h3 className="text-4xl font-bold text-white font-heading tracking-tight group-hover:text-ares-red transition-colors">ARES</h3>
              <p className="text-ares-bronze text-sm font-bold uppercase tracking-widest mt-1">Appalachian Robotics & Engineering Society</p>
            </Link>
            <p className="text-marble text-[10px] font-medium uppercase tracking-[0.2em] mt-2 px-1">
              <a href="https://www.firstinspires.org/robotics/ftc" target="_blank" rel="noopener noreferrer" className="hover:text-ares-red transition-colors underline decoration-ares-red/30 underline-offset-4">
                <em>FIRST</em>® Tech Challenge
              </a> 
              {" "}Team #23247
            </p>
          </div>
          <p className="text-marble/90 text-sm leading-relaxed max-w-md border-l-2 border-ares-bronze/30 pl-6">
            Based in Morgantown, WV, we are engineering the next generation of Mountaineer innovators through the mission of <a href="https://www.firstinspires.org/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-ares-red transition-colors underline decoration-ares-red/30 underline-offset-4 font-bold"><em>FIRST</em>®</a>.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em] mb-5 font-heading border-b border-ares-bronze/20 pb-2 inline-block">Navigation</h4>
          <ul className="flex flex-col gap-2.5 text-[11px] font-bold uppercase tracking-widest text-marble">
            <li><Link to="/" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Home</Link></li>
            <li><Link to="/about" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Who We Are</Link></li>
            <li><Link to="/seasons" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Seasons</Link></li>
            <li><Link to="/outreach" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Outreach</Link></li>
            <li><Link to="/events" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Events</Link></li>
            <li><Link to="/blog" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Team Blog</Link></li>
            <li><Link to="/science-corner" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Science Corner</Link></li>
            <li><a href="https://www.printables.com/@ARESFTC_3784306" target="_blank" rel="noopener noreferrer" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> 3D Models</a></li>
            <li><a href={siteConfig.urls.onshape} target="_blank" rel="noopener noreferrer" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> CAD Workspace</a></li>
            <li><Link to="/docs" className="hover:opacity-80 transition-colors flex items-center gap-2 group"><span>{"//"}</span> <span className="flex items-center shadow-lg ares-cut-sm overflow-hidden"><span className="bg-ares-red px-2.5 py-0.5 text-[10px] font-heading font-bold uppercase text-white tracking-wider border-r border-white/10">ARES</span><span className="bg-white/10 text-white font-heading font-medium px-2.5 py-0.5 text-[10px] uppercase tracking-widest group-hover:bg-white/20 transition-colors">Lib</span></span></Link></li>
            <li><Link to="/join" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Join Us</Link></li>
            <li><Link to="/tech-stack" className="hover:text-ares-red transition-colors flex items-center gap-2"><span>{"//"}</span> Tech Stack</Link></li>
          </ul>
        </div>

        {/* Intelligence / Contact */}
        <div>
          <h4 className="text-white font-bold uppercase text-[10px] tracking-[0.3em] mb-5 font-heading border-b border-ares-bronze/20 pb-2 inline-block">Connect</h4>
          <div className="grid grid-cols-5 gap-2 mb-6 w-fit">
            <a href="https://instagram.com/ares23247" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-red transition-colors text-white" aria-label="Instagram">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href={`https://tiktok.com/@${siteConfig.urls.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-[#000000] transition-colors text-white" aria-label="TikTok">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0A122.18,122.18,0,0,0,381,102.39a122.18,122.18,0,0,0,67,20.14Z"/></svg>
            </a>
            <a href="https://www.youtube.com/@ARESFTC" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-red transition-colors text-white" aria-label="YouTube">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.498 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://bsky.app/profile/ares23247.bsky.social" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-brand-bluesky transition-colors text-white" aria-label="Bluesky">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 512 512"><path d="M111.8 62.2C170.2 105.9 233 194.7 256 242.4c23-47.6 85.8-136.4 144.2-180.2c42.1-31.6 110.3-56 110.3 21.8c0 15.5-8.9 130.5-14.1 149.2C478.2 298.9 416 314.3 353.1 304.9c47.2 32.2 53.6 81.9 5.4 108.8C315.6 437.4 256 376 256 376s-59.6 61.4-102.5 37.7c-48.2-26.9-41.8-76.6 5.4-108.8c-62.9 9.4-125.1-6-143.3-71.7C10.5 214.6 1.6 99.5 1.6 84C1.6 6.2 69.9 30.6 111.8 62.2z"/></svg>
            </a>
            <a href="https://aresfirst.zulipchat.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-cyan transition-colors text-white" aria-label="Zulip Team Chat">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.767 3.589c0 1.209-.543 2.283-1.37 2.934l-8.034 7.174c-.149.128-.343-.078-.235-.25l2.946-5.9c.083-.165-.024-.368-.194-.368H4.452c-1.77 0-3.219-1.615-3.219-3.59C1.233 1.616 2.682 0 4.452 0h15.096c1.77-.001 3.219 1.614 3.219 3.589zM4.452 24h15.096c1.77 0 3.219-1.616 3.219-3.59 0-1.974-1.449-3.59-3.219-3.59H8.12c-.17 0-.277-.202-.194-.367l2.946-5.9c.108-.172-.086-.378-.235-.25l-8.033 7.173c-.828.65-1.37 1.725-1.37 2.934 0 1.974 1.448 3.59 3.218 3.59z"/></svg>
            </a>

            <a href={`https://github.com/${siteConfig.urls.githubOrg}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-[#24292e] transition-colors text-white" aria-label="GitHub Organization">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href={siteConfig.urls.onshape} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-cyan transition-colors text-white" aria-label="Onshape CAD">
              <Hexagon className="w-4 h-4" aria-hidden="true" />
            </a>
            <a href="https://www.printables.com/@ARESFTC_3784306" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-gold transition-colors text-white" aria-label="Printables">
              <Box className="w-4 h-4" aria-hidden="true" />
            </a>
            <a href={siteConfig.urls.toa} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-[#ff9800] transition-colors text-white" aria-label="The Orange Alliance">
              <Trophy className="w-4 h-4" aria-hidden="true" />
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} aria-label={`Email ${siteConfig.team.fullName}`} className="w-9 h-9 bg-marble/10 rounded flex items-center justify-center hover:bg-ares-bronze transition-colors text-white">
              <Mail className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
          <a href={`mailto:${siteConfig.contact.email}`} className="text-marble/80 hover:text-ares-red text-xs font-bold transition-colors block mb-4 tracking-wider">
            {siteConfig.contact.email}
          </a>
          <Link to="/bug-report" className="bg-ares-red text-white hover:bg-white hover:text-ares-red px-3.5 py-1.5 ares-cut-sm transition-all font-bold uppercase tracking-widest text-[9px] inline-flex items-center gap-2 shadow-lg shadow-ares-red/20 w-fit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Report Bug
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-6 border-t border-marble/10 flex flex-col xl:flex-row justify-between items-center gap-8">
        <p className="text-marble text-[9px] font-bold uppercase tracking-[0.25em] opacity-80">
          © {mounted ? new Date().getFullYear() : "2025"} <span className="text-ares-red">ARES</span> 23247. All Rights Reserved.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[9px] font-bold uppercase tracking-[0.2em] text-marble">
          <Link to="/accessibility" className="hover:text-ares-red transition-colors flex items-center gap-2 group">
            <div className="w-4 h-4 rounded-full border border-ares-red/30 flex items-center justify-center group-hover:border-ares-red transition-colors">
              <svg className="w-2 h-2 text-ares-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            Accessibility
          </Link>

          <div className="flex gap-3 items-center opacity-40 px-2">
            <a href="https://wave.webaim.org/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity" title="Validated by WAVE">
              <img src="https://wave.webaim.org/img/wavelogo.svg" alt="WAVE" className="h-2.5 grayscale hover:grayscale-0 transition-all" />
            </a>
            <a href="https://pa11y.org/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity flex items-center font-bold text-[7px] gap-1 text-white" title="pa11y CI">
              <span>PA11Y</span>
            </a>
          </div>
          
          <div className="h-3 w-px bg-marble/10 hidden md:block"></div>

          <Link to="/privacy" className="hover:text-ares-red transition-colors">Privacy</Link>
          <Link to="/science-corner" className="hover:text-ares-red transition-colors">Science</Link>
          
          <Link to="/docs" className="hover:opacity-80 transition-colors flex items-center shadow-sm ares-cut-sm overflow-hidden group border border-white/5">
            <span className="bg-ares-red px-1.5 py-0.5 text-[7px] font-heading font-bold uppercase text-white tracking-wider">ARES</span>
            <span className="bg-white/5 text-white font-heading font-medium px-1.5 py-0.5 text-[7px] uppercase tracking-widest group-hover:bg-white/10 transition-colors">Lib</span>
          </Link>
          
          <Link to="/sponsors" className="hover:text-ares-red transition-colors">Support Us</Link>
        </div>
      </div>
    </footer>
  );
}
