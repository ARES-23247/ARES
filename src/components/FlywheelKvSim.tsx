import React, { useEffect, useRef, useState } from 'react';

export default function FlywheelKvSim() {
  const wCanvasRef = useRef<HTMLCanvasElement>(null);
  const fwGCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [kV, setKv] = useState(0.12);
  const [kP, setKp] = useState(0.08);
  const [fwSet, setFwSet] = useState(80);

  const stateRef = useRef({ kV, kP, fwSet });
  useEffect(() => { stateRef.current = { kV, kP, fwSet }; }, [kV, kP, fwSet]);
  
  const velRef = useRef(0);

  const shoot = () => {
    velRef.current -= 40; 
    if(velRef.current < 0) velRef.current = 0;
  };

  useEffect(() => {
    const wCanvas = wCanvasRef.current;
    const fwGCanvas = fwGCanvasRef.current;
    if (!wCanvas || !fwGCanvas) return;

    const wCtx = wCanvas.getContext('2d');
    const fwGCtx = fwGCanvas.getContext('2d');
    if (!wCtx || !fwGCtx) return;

    let fwAngle = 0;
    const fwHist: {v: number, s: number}[] = [];
    
    let intervalId: number;
    let frameId: number;

    function simFlywheel() {
      const { kV: curKv, kP: curKp, fwSet: curSet } = stateRef.current;
      let fwVel = velRef.current;
      
      const error = curSet - fwVel;
      let voltage = (curKv * curSet) + (curKp * error);
      
      if(voltage > 12) voltage = 12;
      if(voltage < 0) voltage = 0; 
      
      const ACCELERATION = (voltage * 15); 
      const DRAG = (fwVel * fwVel * 0.0005); 
      
      fwVel += (ACCELERATION - DRAG) * 0.02; 
      if(fwVel < 0) fwVel = 0;
      
      fwAngle += (fwVel * 0.02);
      velRef.current = fwVel;
      
      fwHist.push({v: fwVel, s: curSet});
      if(fwHist.length > 250) fwHist.shift();
    }
    
    function drawFlywheel() {
      wCtx!.clearRect(0,0,wCanvas.width,wCanvas.height);
      const cx = wCanvas.width/2;
      const cy = wCanvas.height/2;
      
      wCtx!.save();
      wCtx!.translate(cx, cy);
      wCtx!.rotate(fwAngle);
      
      wCtx!.fillStyle = '#1a1a1a';
      wCtx!.strokeStyle = '#29b6f6'; 
      wCtx!.lineWidth = 4;
      wCtx!.beginPath(); wCtx!.arc(0,0, 50, 0, Math.PI*2); wCtx!.fill(); wCtx!.stroke();
      
      wCtx!.fillStyle = '#444';
      for(let i=0; i<3; i++) {
          wCtx!.rotate(Math.PI*2/3);
          wCtx!.beginPath(); wCtx!.arc(35, 0, 8, 0, Math.PI*2); wCtx!.fill();
      }
      wCtx!.restore();
      
      fwGCtx!.clearRect(0,0,fwGCanvas.width,fwGCanvas.height);
      const gW = fwGCanvas.width;
      const gH = fwGCanvas.height;
      const maxV = 160;
      const slice = gW / 250;
      
      fwGCtx!.strokeStyle = '#222';
      fwGCtx!.lineWidth = 1;
      for(let i=0; i<=4; i++){ fwGCtx!.beginPath(); fwGCtx!.moveTo(0, i*(gH/4)); fwGCtx!.lineTo(gW, i*(gH/4)); fwGCtx!.stroke(); }
      
      if(fwHist.length < 2) { frameId = requestAnimationFrame(drawFlywheel); return; }
      
      fwGCtx!.beginPath();
      fwGCtx!.strokeStyle = '#29b6f6';
      fwGCtx!.lineWidth = 2;
      for(let i=0; i<fwHist.length; i++) {
          const x = i * slice;
          const y = gH - (fwHist[i].s / maxV * gH);
          if(i===0) fwGCtx!.moveTo(x,y); else fwGCtx!.lineTo(x,y);
      }
      fwGCtx!.stroke();
      
      fwGCtx!.beginPath();
      fwGCtx!.strokeStyle = '#B32416';
      fwGCtx!.lineWidth = 2;
      for(let i=0; i<fwHist.length; i++) {
          const x = i * slice;
          const y = gH - (fwHist[i].v / maxV * gH);
          if(i===0) fwGCtx!.moveTo(x,y); else fwGCtx!.lineTo(x,y);
      }
      fwGCtx!.stroke();
      
      frameId = requestAnimationFrame(drawFlywheel);
    }

    intervalId = window.setInterval(simFlywheel, 20);
    drawFlywheel();

    return () => {
      window.clearInterval(intervalId);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#e8e8e8', marginTop: '20px' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #2a2a2a', display: 'flex', gap: '20px', background: '#111', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>
                <span>kV (Velocity FF)</span><span>{kV.toFixed(2)}</span>
            </div>
            <input aria-label="Simulation Configuration Slider" type="range" min="0" max="0.3" step="0.01" value={kV} onChange={e => setKv(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>
                <span>kP (Proportional)</span><span>{kP.toFixed(2)}</span>
            </div>
            <input aria-label="Simulation Configuration Slider" type="range" min="0" max="0.5" step="0.01" value={kP} onChange={e => setKp(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>
                <span>Setpoint (rad/s)</span><span>{fwSet}</span>
            </div>
            <input aria-label="Simulation Configuration Slider" type="range" min="0" max="150" step="5" value={fwSet} onChange={e => setFwSet(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
                onClick={shoot} 
                style={{ background: '#B32416', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Orbitron", sans-serif', fontWeight: 'bold' }}>
                INJECT BALL
            </button>
        </div>
      </div>
      <div style={{ display: 'flex', padding: '20px', gap: '20px', alignItems: 'center' }}>
        <div>
          <canvas role="img" aria-label="Interactive Physics Simulation Environment" ref={wCanvasRef} width="120" height="120" style={{ background: '#1a1a1a', borderRadius: '50%' }} />
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <canvas role="img" aria-label="Interactive Physics Simulation Environment" ref={fwGCanvasRef} width="600" height="220" style={{ display: 'block', width: '100%', background: '#1a1a1a', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
}
