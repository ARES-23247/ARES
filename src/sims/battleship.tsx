import React, { useState } from 'react';

export default function SimComponent() {
  return (
    <div className="sim-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="sim-title" style={{ position: 'absolute', top: 16, left: 16 }}>Blank Simulation</div>
      <div className="sim-value" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 24 }}>
        Ask z.AI to generate something...
      </div>
    </div>
  );
}