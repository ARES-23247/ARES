/** @sim {"name": "Sim 2: Machine Vision", "requiresContext": false} */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Camera, MousePointerSquareDashed, Eraser } from 'lucide-react';

const TEMPLATES = [
  ["00111100", "01000010", "10000001", "10000001", "10000001", "10000001", "01000010", "00111100"], // 0
  ["00011000", "00111000", "00011000", "00011000", "00011000", "00011000", "00011000", "00111100"], // 1
  ["00111100", "01000010", "00000010", "00000100", "00001000", "00010000", "00100000", "01111110"], // 2
  ["00111100", "01000010", "00000010", "00011100", "00000010", "00000010", "01000010", "00111100"], // 3
  ["00000100", "00001100", "00010100", "00100100", "01000100", "01111110", "00000100", "00000100"], // 4
  ["01111110", "01000000", "01000000", "01111100", "00000010", "00000010", "01000010", "00111100"], // 5
  ["00111100", "01000000", "10000000", "11111100", "10000010", "10000010", "01000010", "00111100"], // 6
  ["01111110", "00000010", "00000100", "00001000", "00010000", "00100000", "00100000", "00100000"], // 7
  ["00111100", "01000010", "01000010", "00111100", "01000010", "01000010", "01000010", "00111100"], // 8
  ["00111100", "01000010", "01000010", "01000010", "00111110", "00000010", "01000010", "00111100"], // 9
];

export default function NnVisionSim() {
  const [pixels, setPixels] = useState<number[]>(new Array(64).fill(0));
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [inspectDigit, setInspectDigit] = useState<number | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const weights = useMemo(() => {
    const w: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const row: number[] = [];
      const templateStr = TEMPLATES[i].join('');
      for (let j = 0; j < 64; j++) {
        row.push(templateStr[j] === '1' ? 4 : -4); // 4 and -4 to make it sharp
      }
      w.push(row);
    }
    return w;
  }, []);

  const biases = useMemo(() => {
    const b: number[] = [];
    for (let i = 0; i < 10; i++) {
      const numOnes = TEMPLATES[i].join('').split('1').length - 1;
      b.push(-4 * (numOnes - 0.5));
    }
    return b;
  }, []);

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

  const outputs = useMemo(() => {
    return weights.map((row, i) => {
      const sum = row.reduce((acc, w, j) => acc + (w * pixels[j]), 0);
      return sigmoid(sum + biases[i]);
    });
  }, [pixels, weights, biases]);

  const maxOutput = Math.max(...outputs);
  const predictedDigit = outputs.indexOf(maxOutput);

  // Drawing Logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (target.dataset.index) {
      const idx = parseInt(target.dataset.index);
      const isCurrentlyOn = pixels[idx] === 1;
      setIsErasing(isCurrentlyOn);
      setIsDrawing(true);
      updatePixel(idx, isCurrentlyOn ? 0 : 1);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (target && target.dataset.index) {
      const idx = parseInt(target.dataset.index);
      updatePixel(idx, isErasing ? 0 : 1);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const updatePixel = (idx: number, val: number) => {
    setPixels(prev => {
      if (prev[idx] === val) return prev;
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  useEffect(() => {
    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const formatNum = (n: number) => n.toFixed(2);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '24px',
      overflow: 'auto',
      color: '#f3f4f6',
      background: '#0f1115',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Camera className="w-8 h-8 text-emerald-500" />
          Sim 2: Machine Vision (8x8 Grid)
        </h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '15px' }}>
          Draw a digit (0-9) on the grid. Hover over the output nodes to inspect their learned "feature maps" (weights).
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '40px', alignItems: 'flex-start', justifyContent: 'center' }}>
        
        {/* Drawing Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
             <h3 style={{ margin: 0, color: '#10b981' }}>Input: 64 Pixels</h3>
             <button onClick={() => setPixels(new Array(64).fill(0))} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'transparent', border: '1px solid #4b5563', color: '#9ca3af', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
               <Eraser className="w-3 h-3" /> Clear
             </button>
          </div>
         
          <div 
            ref={gridRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: '2px', 
              background: '#374151', 
              padding: '2px', 
              borderRadius: '8px',
              border: '2px solid #10b981',
              touchAction: 'none',
              userSelect: 'none'
            }}
          >
            {pixels.map((p, i) => (
              <div 
                key={i} 
                data-index={i}
                style={{ 
                  width: '35px', 
                  height: '35px', 
                  background: p ? '#fff' : '#000', 
                  cursor: 'crosshair',
                  transition: 'background 0.1s'
                }} 
              />
            ))}
          </div>

          <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MousePointerSquareDashed className="w-4 h-4" /> Click and drag to draw
          </div>
        </div>

        {/* Feature Map Inspection */}
        <div style={{ flex: 1, height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px' }}>
          {inspectDigit !== null ? (
            <>
              <h3 style={{ margin: '0 0 16px 0', color: '#60a5fa' }}>Weight Matrix for "{inspectDigit}"</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', background: '#374151', padding: '2px', borderRadius: '8px' }}>
                 {weights[inspectDigit].map((w, i) => (
                   <div 
                     key={i} 
                     style={{ 
                       width: '25px', 
                       height: '25px', 
                       background: w > 0 ? `rgba(74, 222, 128, ${w/5})` : `rgba(239, 68, 68, ${-w/5})`, 
                     }} 
                   />
                 ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#4ade80' }}/> Excitatory (+)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444' }}/> Inhibitory (-)</div>
              </div>
            </>
          ) : (
            <div style={{ color: '#6b7280', textAlign: 'center' }}>
              Hover over an output node<br/>to inspect its learned weights.
            </div>
          )}
        </div>

        {/* Output Layer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#10b981', textAlign: 'center' }}>Output Layer</h3>
          {outputs.map((val, idx) => {
            const isWinner = maxOutput > 0.5 && idx === predictedDigit;
            return (
              <div 
                key={idx} 
                onMouseEnter={() => setInspectDigit(idx)}
                onMouseLeave={() => setInspectDigit(null)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  background: inspectDigit === idx ? 'rgba(255,255,255,0.05)' : 'transparent',
                  cursor: 'help'
                }}
              >
                <div style={{ width: '24px', fontWeight: 'bold', color: isWinner ? '#fff' : '#9ca3af', textAlign: 'center' }}>{idx}</div>
                <div style={{ flex: 1, height: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', overflow: 'hidden', minWidth: '100px' }}>
                  <div style={{ height: '100%', width: `${val * 100}%`, background: isWinner ? '#10b981' : '#3b82f6', transition: '0.3s' }} />
                </div>
                <div style={{ width: '40px', fontSize: '12px', color: isWinner ? '#10b981' : '#6b7280', textAlign: 'right' }}>
                  {formatNum(val)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
