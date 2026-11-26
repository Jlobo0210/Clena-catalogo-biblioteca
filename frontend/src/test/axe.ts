import axe from 'axe-core';

/**
 * HU-33: corre axe-core sobre lo que se renderizó y devuelve las violaciones de WCAG 2.2 AA.
 * El contraste de color se revisa en el navegador real (jsdom no calcula estilos): ver
 * docs/accesibilidad.md.
 */
export async function violacionesAxe(contenedor: Element): Promise<string[]> {
  const resultado = await axe.run(contenedor, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return resultado.violations.map(
    (v) => `${v.id} (${v.impact ?? 'sin impacto'}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
}
