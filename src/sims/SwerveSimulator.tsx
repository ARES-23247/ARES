import { useEffect, useRef, useState, useCallback } from "react";

export default function SwerveSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transX, setTransX] = useState(1);
  const [transY, setTransY] = useState(0);
  const [rotVel, setRotVel] = useState(2);

  const renderSim = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SCALE = 30; 
    const BOT_SIZE = 120;
    const CENTER = { x: 400, y: 200 };
    
    const MODULES = [
        { name: "FL", x: -BOT_SIZE/2, y: -BOT_SIZE/2 },
        { name: "FR", x: BOT_SIZE/2, y: -BOT_SIZE/2 },
        { name: "BL", x: -BOT_SIZE/2, y: BOT_SIZE/2 },
        { name: "BR", x: BOT_SIZE/2, y: BOT_SIZE/2 }
    ];

    function drawArrow(fromX: number, fromY: number, toX: number, toY: number, color: string, width = 2, headSize = 8) {
      if(!ctx) return;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headSize * Math.cos(angle - Math.PI/6), toY - headSize * Math.sin(angle - Math.PI/6));
      ctx.lineTo(toX - headSize * Math.cos(angle + Math.PI/6), toY - headSize * Math.sin(angle + Math.PI/6));
      ctx.fill();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.strokeRect(CENTER.x - BOT_SIZE/2, CENTER.y - BOT_SIZE/2, BOT_SIZE, BOT_SIZE);
    
    MODULES.forEach(mod => {
        const mX = CENTER.x + mod.x;
        const mY = CENTER.y + mod.y;
        
        ctx.fillStyle = "var(--obsidian)";
        ctx.fillRect(mX - 10, mY - 10, 20, 20);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.strokeRect(mX - 10, mY - 10, 20, 20);

        const tVecX = transX * SCALE;
        const tVecY = transY * SCALE;
        drawArrow(mX, mY, mX + tVecX, mY + tVecY, "var(--ares-cyan)", 1, 5);

        const rVecX = -mod.y * rotVel * (SCALE/50);
        const rVecY = mod.x * rotVel * (SCALE/50);
        drawArrow(mX, mY, mX + rVecX, mY + rVecY, "var(--ares-red)", 1, 5);

        const resX = tVecX + rVecX;
        const resY = tVecY + rVecY;
        drawArrow(mX, mY, mX + resX, mY + resY, "var(--ares-bronze)", 3, 10);
    });

    ctx.font = "12px Inter";
    ctx.fillStyle = "var(--ares-cyan)"; ctx.fillText("Translation Component", 20, 340);
    ctx.fillStyle = "var(--ares-red)"; ctx.fillText("Rotation Component", 20, 360);
    ctx.fillStyle = "var(--ares-bronze)"; ctx.fillText("Final Module State", 20, 380);
  }, [transX, transY, rotVel]);

  useEffect(() => {
    renderSim();
  }, [renderSim]);

  return (
    <div className="glass-card hero-card p-5 my-8">
      <canvas 
        ref={canvasRef} 
        width={800} height={400} 
        className="w-full h-[400px] bg-obsidian ares-cut-sm border border-white/10" 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <div>
          <label className="text-white/60 text-sm block mb-2">Translation X: <span className="text-ares-gold">{transX.toFixed(1)} m/s</span></label>
          <input type="range" min="-5" max="5" value={transX} step="0.1" className="w-full ares-slider" onChange={(e) => setTransX(parseFloat(e.target.value))} />
        </div>
        <div>
          <label className="text-white/60 text-sm block mb-2">Translation Y: <span className="text-ares-gold">{transY.toFixed(1)} m/s</span></label>
          <input type="range" min="-5" max="5" value={transY} step="0.1" className="w-full ares-slider" onChange={(e) => setTransY(parseFloat(e.target.value))} />
        </div>
        <div>
          <label className="text-white/60 text-sm block mb-2">Rotation: <span className="text-ares-gold">{rotVel.toFixed(1)} rad/s</span></label>
          <input type="range" min="-10" max="10" value={rotVel} step="0.1" className="w-full ares-slider" onChange={(e) => setRotVel(parseFloat(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
