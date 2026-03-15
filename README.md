# artefactos.pro

Hub de 50 mini-experiencias de IA. Bilingüe ES/EN. Vanilla JS + Groq API.

## Estructura del proyecto

```
artefactos/                     ← Raíz (Cloudflare Pages)
├── index.html                  ← Galería principal
├── 404.html                    ← Página de error
├── _redirects                  ← Reglas Cloudflare Pages
├── _headers                    ← Headers de seguridad y caché
├── styles/
│   ├── main.css                ← Estilos globales del hub
│   └── ads.css                 ← Estilos AdSense
├── js/
│   ├── groq.js                 ← Cliente Groq (namespace: artefactos_groq_key)
│   ├── apikey-panel.js         ← Componente UI para clave API
│   ├── i18n.js                 ← Sistema bilingüe (50 artefactos × 2 idiomas)
│   ├── main.js                 ← Lógica galería: filtros, búsqueda, idioma
│   └── ads.js                  ← Inicialización AdSense
├── gabinete/                   ← ⚠️ PREEXISTENTE — NO MODIFICAR
│   └── (10 artefactos live)
└── artefactos/                 ← Carpetas para futuros artefactos
    ├── productividad/
    ├── research/
    ├── creatividad/
    └── educacion/
```

> **Nota:** `gabinete/` es una subcarpeta independiente que ya existía antes de este hub. Tiene su propio `groq.js` con namespace `gabinete_groq_key`. No modificar nada allí.

## Requisitos

- Ningún build tool — vanilla HTML/CSS/JS
- El usuario aporta su clave Groq gratuita (sin registro, sin backend)
- Clave se almacena en `localStorage` con key `artefactos_groq_key`

## Monetización

Se usa **Monetag** (auto-inyección vía tag). No necesita slots HTML ni configuración adicional en el código.

## Deploy en Cloudflare Pages

1. Sube el repositorio a GitHub
2. En [Cloudflare Pages](https://pages.cloudflare.com/):
   - Conecta el repositorio
   - **Build command:** (vacío — no hay build)
   - **Build output directory:** `/`
   - **Rama:** `main`
3. Configura el dominio personalizado:
   - En DNS de Cloudflare, apunta `artefactos.pro` al proyecto de Pages
   - Cloudflare genera automáticamente el SSL

## Cómo añadir un nuevo artefacto

1. Crea la carpeta dentro de la categoría correspondiente:
   ```
   artefactos/productividad/mi-artefacto/
   ├── mi-artefacto.html
   ├── mi-artefacto.css
   └── mi-artefacto.js
   ```

2. En `js/main.js`, busca el array `CATALOGO` y cambia el estado del artefacto:
   ```javascript
   { id: 'mi-artefacto', slug: 'artefactos/productividad/mi-artefacto/', ..., estado: 'live' }
   ```

3. Las traducciones ya están definidas en `js/i18n.js` para los 50 artefactos del catálogo.

## Namespaces de localStorage

| Key                  | Proyecto       | Descripción           |
|---------------------|----------------|-----------------------|
| `artefactos_groq_key` | artefactos.pro | Clave API Groq        |
| `artefactos_lang`     | artefactos.pro | Idioma seleccionado   |
| `artefactos_filtro`   | artefactos.pro | Filtro de categoría   |
| `gabinete_groq_key`   | gabinete       | Clave API (separada)  |
| `gabinete_lang`       | gabinete       | Idioma (separado)     |

## Tecnologías

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES modules)
- **IA:** Groq API (LLaMA 3.3 70B Versatile)
- **Hosting:** Cloudflare Pages
- **Monetización:** Google AdSense
- **Tipografías:** Syne · DM Sans · JetBrains Mono (Google Fonts)
