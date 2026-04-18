import { common, createLowlight } from 'lowlight';

try {
  const lowlight = createLowlight(common);
  console.log('Lowlight created:', !!lowlight);
  console.log('List of languages:', lowlight.listLanguages());
} catch (e) {
  console.error('Error creating lowlight:', e);
}
