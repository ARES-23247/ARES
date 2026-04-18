import React from 'react';
import './CoreValueCallout.css';

interface CoreValueCalloutProps {
  value: 'discovery' | 'innovation' | 'impact' | 'teamwork' | 'inclusion' | 'fun';
  children: React.ReactNode;
}

const valueConfig = {
  discovery: { title: 'Discovery', icon: '/img/core-values/discovery.png', color: '#ef4435' },
  innovation: { title: 'Innovation', icon: '/img/core-values/innovation.png', color: '#3498db' },
  impact: { title: 'Impact', icon: '/img/core-values/impact.png', color: '#2ecc71' },
  teamwork: { title: 'Teamwork', icon: '/img/core-values/teamwork.png', color: '#e67e22' },
  inclusion: { title: 'Inclusion', icon: '/img/core-values/inclusion.png', color: '#9b59b6' },
  fun: { title: 'Fun', icon: '/img/core-values/fun.png', color: '#f1c40f' },
};

export const CoreValueCallout = ({ value, children }: CoreValueCalloutProps) => {
  const config = valueConfig[value];

  return (
    <div className={`core-value-callout ${value}`} style={{ '--accent-color': config.color } as React.CSSProperties}>
      <div className="callout-header">
        <img src={config.icon} alt="" className="callout-icon" />
        <span className="callout-label">MARS {config.title} Moment</span>
      </div>
      <div className="callout-content">
        {children}
      </div>
    </div>
  );
};
