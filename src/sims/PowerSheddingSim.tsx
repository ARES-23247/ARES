import { useState } from 'react';

export default function PowerSheddingSim() {
  const [loads, setLoads] = useState({
    swerve: false,
    shooter: false,
    intake: false,
    compressor: false,
  });

  const internalResistance = 0.015; // Ohms
  const nominalVoltage = 12.5;

  // Load values in Amps
  const loadValues = {
    swerve: 160,
    shooter: 60,
    intake: 40,
    compressor: 30,
  };

  let totalCurrent = 0;
  
  // Tier 1: Swerve (Never sheds)
  if (loads.swerve) totalCurrent += loadValues.swerve;
  
  // Tier 2: Shooter (Scales slightly, but for sim we'll keep it simple)
  if (loads.shooter) totalCurrent += loadValues.shooter;

  // Initial check for potential voltage sag with T1/T2
  const potentialVoltage = nominalVoltage - (totalCurrent * internalResistance);
  const isShedding = potentialVoltage < 9.5;

  // Tier 3: Intake / Compressor (Sheds heavily)
  if (loads.intake) {
    totalCurrent += isShedding ? (loadValues.intake * 0.1) : loadValues.intake;
  }
  if (loads.compressor) {
    totalCurrent += isShedding ? (loadValues.compressor * 0.1) : loadValues.compressor;
  }

  const voltage = nominalVoltage - (totalCurrent * internalResistance);
  const isBrownout = voltage < 7.0;

  const toggleLoad = (load: keyof typeof loads) => {
    setLoads(prev => ({ ...prev, [load]: !prev[load] }));
  };

  const getVoltageColor = () => {
    if (isBrownout) return '#ff4d4d';
    if (isShedding) return '#ff9f43';
    return '#00d0ff';
  };

  return (
    <div style={{
      background: '#050505',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: '12px',
      margin: '30px 0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: '"Orbitron", sans-serif'
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        fontSize: '14px',
        fontWeight: 700,
        color: 'var(--mars-red-light)'
      }}>
        REAL-TIME POWER SHEDDING DIAGNOSTICS
      </div>

      <div style={{
        display: 'flex',
        padding: '24px',
        gap: '30px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* LOAD TOGGLES */}
        <div style={{
          flex: '1 1 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>LOAD CONTROL (ACTIVATE MECHANISMS)</div>
          
          <button 
            onClick={() => toggleLoad('swerve')}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: loads.swerve ? '#ff4d4d' : '#222',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              transition: '0.2s'
            }}>
            <span>[T1] SWERVE DRIVE</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>+160A</span>
          </button>

          <button 
            onClick={() => toggleLoad('shooter')}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: loads.shooter ? '#ff9f43' : '#222',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              transition: '0.2s'
            }}>
            <span>[T2] SHOOTER FLYWHEELS</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>+60A</span>
          </button>

          <button 
            onClick={() => toggleLoad('intake')}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: loads.intake ? (isShedding ? '#444' : '#29b6f6') : '#222',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              transition: '0.2s',
              opacity: loads.intake && isShedding ? 0.6 : 1
            }}>
            <span>[T3] INTAKE MOTORS</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {loads.intake && isShedding ? '+4A (SHED)' : '+40A'}
            </span>
          </button>

          <button 
            onClick={() => toggleLoad('compressor')}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: loads.compressor ? (isShedding ? '#444' : '#29b6f6') : '#222',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              transition: '0.2s',
              opacity: loads.compressor && isShedding ? 0.6 : 1
            }}>
            <span>[T3] COMPRESSOR</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {loads.compressor && isShedding ? '+3A (SHED)' : '+30A'}
            </span>
          </button>
        </div>

        {/* DASHBOARD */}
        <div style={{
          flex: '1 1 250px',
          background: '#111',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 800,
            color: getVoltageColor(),
            textShadow: `0 0 20px ${getVoltageColor()}44`
          }}>
            {voltage.toFixed(1)}V
          </div>
          
          <div style={{
            fontSize: '12px',
            color: isBrownout ? '#ff4d4d' : (isShedding ? '#ff9f43' : '#00d0ff'),
            letterSpacing: '0.1em'
          }}>
            {isBrownout ? 'CRITICAL BROWNOUT' : (isShedding ? 'POWER SHEDDING ACTIVE' : 'SYSTEM NOMINAL')}
          </div>

          <div style={{
            width: '100%',
            height: '10px',
            background: '#222',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(voltage / 12.5) * 100}%`,
              height: '100%',
              background: getVoltageColor(),
              transition: '0.3s ease-out'
            }}></div>
          </div>

          {isShedding && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255, 159, 67, 0.05)',
              pointerEvents: 'none',
              animation: 'pulse 2s infinite'
            }}></div>
          )}

          {isBrownout && (
            <div style={{
              padding: '8px 12px',
              background: '#ff4d4d',
              color: '#000',
              fontWeight: 900,
              fontSize: '10px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              ROBORIO DISCONNECT RISK
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { opacity: 0.2; }
        }
      `}} />
    </div>
  );
}
