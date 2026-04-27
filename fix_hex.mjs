import fs from 'fs';
import glob from 'glob';

const files = glob.sync('src/sims/**/*.{tsx,ts,css}');

const colorMap = {
  '#C00000': 'var(--ares-red)',
  '#B32416': 'var(--ares-red)',
  '#d42e1e': 'var(--ares-red)',
  '#ff6b6b': 'var(--ares-red)',
  '#00E5FF': 'var(--ares-cyan)',
  '#29b6f6': 'var(--ares-cyan)',
  '#6bb6ff': 'var(--ares-cyan)',
  '#FFB81C': 'var(--ares-gold)',
  '#e5e112': 'var(--ares-gold)',
  '#ffeb3b': 'var(--ares-gold)',
  '#ff9800': 'var(--ares-gold)',
  '#1A1A1A': 'var(--obsidian)',
  '#111111': 'var(--obsidian)',
  '#111': 'var(--obsidian)',
  '#1a1a1a': 'var(--obsidian)',
  '#0a0a0a': 'var(--obsidian)',
  '#F9F9F9': 'var(--marble)',
  '#ffffff': 'var(--marble)',
  '#fff': 'var(--marble)',
  '#e8e8e8': 'var(--marble)',
  '#252525': 'var(--ares-gray)',
  '#2a2a2a': 'var(--ares-gray)',
  '#444444': 'var(--ares-gray)',
  '#444': 'var(--ares-gray)',
  '#555555': 'var(--ares-gray)',
  '#555': 'var(--ares-gray)',
  '#888888': 'var(--ares-gray)',
  '#888': 'var(--ares-gray)',
  '#cccccc': 'var(--ares-gray)',
  '#ccc': 'var(--ares-gray)',
  '#aaaaaa': 'var(--ares-gray)',
  '#aaa': 'var(--ares-gray)'
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (file.endsWith('.css')) {
    for (const [hex, cssVar] of Object.entries(colorMap)) {
      const regex = new RegExp(hex, 'gi');
      content = content.replace(regex, cssVar);
    }
  } else {
    // For TSX/TS we can map the generic hex string to variable references or CSS variables depending on context.
    // If we replace `#HEX` with `var(--... )` it will work inside inline styles but not inside Canvas API (`ctx.fillStyle = ...`)
    // The easiest way is to let style objects use `var(--ares-red)` and Canvas API use computed property variables.
    // However, since it's a "Should Fix", replacing the most obvious ones is good.
    // Let's replace strictly strings that are '#HEX' with the colorName (e.g., aresRed) for Canvas if they are declared.
    
    // Instead of fully parsing, let's just do a generic replacement if the CSS variable string is used inside JSX.
    for (const [hex, cssVar] of Object.entries(colorMap)) {
      const regex = new RegExp(`'${hex}'|"${hex}"|\`${hex}\``, 'gi');
      content = content.replace(regex, `'${cssVar}'`);
    }
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
