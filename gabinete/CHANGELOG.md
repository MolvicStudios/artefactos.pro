# CHANGELOG — Gabinete de Curiosidades

## Tanda 2

### Nuevos artefactos

- **Máquina del Tiempo** (`artefactos/maquina-tiempo/`)  
  Narrativa interactiva por épocas con efecto máquina de escribir, cielo estrellado canvas y datos históricos reales.

- **Gabinete de Objetos** (`artefactos/gabinete-objetos/`)  
  Vitrina museística con objetos imposibles generados por IA, ilustraciones SVG procedurales por categoría y mecánica de revelado.

- **Bestiario Digital** (`artefactos/bestiario/`)  
  Enciclopedia de criaturas fantásticas con buscador autocompletado, ilustraciones SVG por tipo y panel de criaturas exploradas.

- **Mapa de Ideas** (`artefactos/mapa-ideas/`)  
  Grafo de fuerza D3.js con 20 nodos semilla, expansión de conceptos vía IA, panel lateral con definición y citas.

- **Sinfonía Generativa** (`artefactos/sinfonia/`)  
  Composición musical generativa con Web Audio API, visualización canvas (curvas de Lissajous + partículas), 8 estados de ánimo y modo meditación.

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `js/i18n.js` | +70 claves de traducción (ES/EN) para los 5 artefactos y panel de API key |
| `js/main.js` | 5 nuevas tarjetas con badge "NUEVO", soporte de badge en `renderGallery()` |
| `index.html` | Eliminado `config.js`, CSS para badge y estilos especiales de Mapa de Ideas |

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `js/apikey-panel.js` | Componente UI de ingreso de clave API (panel centrado + botón cambiar) |
| `artefactos/maquina-tiempo/maquina-tiempo.html` | HTML Máquina del Tiempo |
| `artefactos/maquina-tiempo/maquina-tiempo.css` | Estilos Máquina del Tiempo |
| `artefactos/maquina-tiempo/maquina-tiempo.js` | Lógica Máquina del Tiempo |
| `artefactos/gabinete-objetos/gabinete-objetos.html` | HTML Gabinete de Objetos |
| `artefactos/gabinete-objetos/gabinete-objetos.css` | Estilos Gabinete de Objetos |
| `artefactos/gabinete-objetos/gabinete-objetos.js` | Lógica Gabinete de Objetos |
| `artefactos/bestiario/bestiario.html` | HTML Bestiario Digital |
| `artefactos/bestiario/bestiario.css` | Estilos Bestiario Digital |
| `artefactos/bestiario/bestiario.js` | Lógica Bestiario Digital |
| `artefactos/mapa-ideas/mapa-ideas.html` | HTML Mapa de Ideas |
| `artefactos/mapa-ideas/mapa-ideas.css` | Estilos Mapa de Ideas |
| `artefactos/mapa-ideas/mapa-ideas.js` | Lógica Mapa de Ideas (D3.js) |
| `artefactos/sinfonia/sinfonia.html` | HTML Sinfonía Generativa |
| `artefactos/sinfonia/sinfonia.css` | Estilos Sinfonía Generativa |
| `artefactos/sinfonia/sinfonia.js` | Lógica Sinfonía Generativa (Web Audio + Canvas) |
