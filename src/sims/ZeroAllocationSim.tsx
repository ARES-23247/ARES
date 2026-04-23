import { useEffect, useRef, useState } from 'react';

export default function ZeroAllocationSim() {
  const loopCanvasRef = useRef<HTMLCanvasElement>(null);
  const heapCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mode, setMode] = useState<"STD" | "MARS">("MARS");
  const [loopTxt, setLoopTxt] = useState<{ text: string, color: string }>({ text: "20.0ms", color: "#00E5FF" });

  const loopTimesRef = useRef<{ ts: number, gc: boolean }[]>([]);
  const heapFillRef = useRef(0);
  const modeRef = useRef<"STD" | "MARS">("MARS");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const lCanvas = loopCanvasRef.current;
    const hCanvas = heapCanvasRef.current;
    if (!lCanvas || !hCanvas) return;

    const lCtx = lCanvas.getContext('2d');
    const hCtx = hCanvas.getContext('2d');
    if (!lCtx || !hCtx) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resize = () => {
        if (lCanvas.parentElement) {
            lCanvas.width = lCanvas.parentElement.clientWidth;
            lCanvas.height = lCanvas.parentElement.clientHeight;
        }
        if (hCanvas.parentElement) {
            hCanvas.width = hCanvas.parentElement.clientWidth;
            hCanvas.height = hCanvas.parentElement.clientHeight - 20;
        }
    };
    
    window.addEventListener('resize', resize);
    resize(); // initial sizing

    const draw = () => {
        const loopTimes = loopTimesRef.current;
        const heapFill = heapFillRef.current;

        lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
        const lw = lCanvas.width, lh = lCanvas.height;
        const targetY = lh - (20 / 80) * lh;
        
        lCtx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        lCtx.setLineDash([5, 5]);
        lCtx.beginPath(); lCtx.moveTo(0, targetY); lCtx.lineTo(lw, targetY); lCtx.stroke();
        lCtx.setLineDash([]);
        
        const slice = lw / 250;
        lCtx.beginPath(); lCtx.moveTo(0, lh);
        for (let i = 0; i < loopTimes.length; i++) {
            const y = lh - (loopTimes[i].ts / 80) * lh;
            lCtx.lineTo(i * slice, Math.max(0, y));
        }
        lCtx.lineTo((loopTimes.length > 0 ? loopTimes.length - 1 : 0) * slice, lh);
        lCtx.fillStyle = 'rgba(255,255,255,0.05)';
        lCtx.fill();
        
        lCtx.beginPath();
        for (let i = 0; i < loopTimes.length; i++) {
            const y = lh - (loopTimes[i].ts / 80) * lh;
            if (i === 0) lCtx.moveTo(i * slice, Math.max(0, y));
            else lCtx.lineTo(i * slice, Math.max(0, y));
        }
        lCtx.strokeStyle = '#e8e8e8'; lCtx.lineWidth = 2; lCtx.stroke();
        
        for (let i = 0; i < loopTimes.length; i++) {
            if (loopTimes[i].gc) {
                const y = lh - (loopTimes[i].ts / 80) * lh;
                lCtx.beginPath(); lCtx.arc(i * slice, Math.max(0, y), 4, 0, Math.PI * 2);
                lCtx.fillStyle = '#FF4D4D'; // var(--ares-red-light)
                lCtx.fill();
            }
        }
        
        hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
        const hw = hCanvas.width, hh = hCanvas.height;
        const fillH = heapFill * hh;
        
        hCtx.fillStyle = '#4a4a4a'; hCtx.fillRect(0, 0, hw, hh);
        hCtx.fillStyle = heapFill > 0.9 ? '#FF4D4D' : '#00E5FF';
        hCtx.fillRect(0, hh - fillH, hw, fillH);
        
        if (heapFill > 0.9) {
            hCtx.fillStyle = '#fff'; hCtx.font = '12px "Orbitron", sans-serif'; 
            hCtx.fillText("GC!", hw / 2 - 10, 20); 
        }
    };

    const simulate = () => {
        const currentMode = modeRef.current;
        let loopMs = 20.0 + (Math.random() * 0.8 - 0.4);
        let isGC = false;
        
        if (currentMode === "STD") {
            heapFillRef.current += 0.008;
            if (heapFillRef.current >= 1.0) { 
                heapFillRef.current = 0; 
                isGC = true; 
                loopMs = 50.0 + Math.random() * 20.0; 
            }
        } else { 
            heapFillRef.current = 0.15; 
        }
        
        loopTimesRef.current.push({ ts: loopMs, gc: isGC });
        if (loopTimesRef.current.length > 250) loopTimesRef.current.shift();
        
        draw();
        
        if (isGC) {
            setLoopTxt({ text: loopMs.toFixed(1) + "ms (GC SPIKE)", color: "#FF4D4D" });
        } else {
            setLoopTxt({ text: loopMs.toFixed(1) + "ms", color: "#00E5FF" });
        }
        
        if (document.hasFocus() || window.document.visibilityState === 'visible') {
             timeoutId = setTimeout(simulate, loopMs);
        } else {
             timeoutId = setTimeout(simulate, Math.max(100, loopMs)); // slow down in background
        }
    };

    simulate();

    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ background: '#050505', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '12px', margin: '30px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
      <div style={{ display: 'flex', gap: '20px', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button 
            onClick={() => setMode("STD")}
            style={{ flex: 1, background: mode === "STD" ? '#FF4D4D' : '#1A1A1A', color: '#fff', border: mode === "STD" ? '1px solid #FF4D4D' : '1px solid #4a4a4a', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, transition: '0.2s' }}>
            STANDARD FRC (Allocating)
          </button>
          <button 
            onClick={() => setMode("MARS")}
            style={{ flex: 1, background: mode === "MARS" ? '#00E5FF' : '#1A1A1A', color: mode === "MARS" ? '#000' : '#fff', border: mode === "MARS" ? '1px solid #00E5FF' : '1px solid #4a4a4a', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, transition: '0.2s' }}>
            MARSLIB (Zero-Allocation)
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', padding: '20px', gap: '20px', alignItems: 'stretch', height: '400px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <canvas role="img" aria-label="Interactive Physics Simulation Environment" ref={loopCanvasRef} style={{ width: '100%', height: '100%', display: 'block', border: '1px solid var(--ifm-color-emphasis-200)', background: '#1A1A1A', borderRadius: '6px' }}></canvas>
          <div style={{ position: 'absolute', top: '10px', left: '15px', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#e8e8e8' }}>
            LOOP TIME: <span style={{ color: loopTxt.color }}>{loopTxt.text}</span>
          </div>
        </div>
        <div style={{ flex: '0 0 100px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <canvas role="img" aria-label="Interactive Physics Simulation Environment" ref={heapCanvasRef} style={{ flex: 1, display: 'block', border: '1px solid var(--ifm-color-emphasis-200)', background: '#1A1A1A', borderRadius: '6px' }}></canvas>
          <div style={{ textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: '#999', marginTop: '5px' }}>JVM HEAP</div>
        </div>
      </div>
    </div>
  );
}
