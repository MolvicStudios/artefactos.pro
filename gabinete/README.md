# Gabinete de Curiosidades Interactivas

**MolvicStudios.pro** — Sección de portfolio interactivo con 5 experiencias de IA.

## 🚀 Configuración rápida

### 1. Obtener API Key de Groq (gratuita)

1. Ve a [https://console.groq.com](https://console.groq.com)
2. Regístrate con tu email o Google
3. En el panel, ve a **"API Keys"** → **"Create API Key"**
4. Copia la clave (empieza por `gsk_...`)

### 2. Configurar la API Key

```bash
cd gabinete/js/
cp config.example.js config.js
```

Edita `config.js` y reemplaza `TU_CLAVE_AQUI` con tu API Key:

```javascript
window.__GROQ_KEY__ = 'gsk_tu_clave_real_aqui';
```

> ⚠️ **Nunca subas `config.js` a GitHub.** Asegúrate de que esté en tu `.gitignore`.

### 3. Añadir a `.gitignore`

```
gabinete/js/config.js
```

## 📁 Estructura del proyecto

```
gabinete/
├── index.html                  ← Galería principal (5 artefactos)
├── styles/
│   └── gabinete.css            ← Estilos globales + variables
├── js/
│   ├── main.js                 ← Lógica de galería + selector de idioma
│   ├── groq.js                 ← Cliente Groq reutilizable
│   ├── i18n.js                 ← Traducciones ES/EN
│   ├── config.js               ← Tu API Key (NO subir a Git)
│   └── config.example.js       ← Plantilla de configuración
├── artefactos/
│   ├── oraculo/                ← El Oráculo de Delfos
│   ├── musicsage/              ← MusicSage
│   ├── alquimista/             ← El Alquimista
│   ├── duelo/                  ← Duelo de Filósofos
│   └── scriptorium/            ← El Scriptorium
├── snippet-boton-flotante.html ← Botón flotante para molvicstudios.pro
└── README.md
```

## 🎭 Los 5 Artefactos

| Artefacto | Descripción |
|-----------|------------|
| **El Oráculo de Delfos** | Consulta a la Pitia. Respuestas proféticas y ambiguas. |
| **MusicSage** | Chat con un musicólogo erudito. Teoría, historia, géneros. |
| **El Alquimista** | Diálogo con Paracelso. Filosofía hermética y alquimia. |
| **Duelo de Filósofos** | Enfrenta a dos filósofos en debate. 10 pensadores disponibles. |
| **El Scriptorium** | Transforma texto al estilo de 6 épocas literarias. |

## 🌐 Idiomas

La interfaz es bilingüe ES/EN. El selector de idioma guarda la preferencia en `localStorage` y persiste entre artefactos.

## ☁️ Despliegue en Cloudflare Pages

### Opción A: Upload directo (más simple)

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Crea un nuevo proyecto
3. Sube la carpeta `gabinete/` directamente
4. Tu sitio estará disponible en `tu-proyecto.pages.dev/`

### Opción B: Conectar repositorio Git

1. Sube el proyecto a GitHub/GitLab (sin `config.js`)
2. En Cloudflare Pages, conecta el repositorio
3. Configura:
   - **Build command:** (vacío, es HTML estático)
   - **Build output directory:** `gabinete`
4. Para la API Key en producción, tienes dos opciones:

#### Opción para la API Key en producción

**Worker Proxy (recomendado para seguridad):**

Crea un Cloudflare Worker que actúe como proxy:

```javascript
// worker.js (ejemplo simplificado)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/groq' && request.method === 'POST') {
      const body = await request.json();
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify(body)
      });
      return response;
    }
    return new Response('Not found', { status: 404 });
  }
};
```

Configura `GROQ_API_KEY` como variable de entorno en el Worker.

**Inyección por build script:**

O simplemente genera `config.js` en el build:
```bash
echo "window.__GROQ_KEY__ = '${GROQ_API_KEY}';" > gabinete/js/config.js
```

## 🔘 Botón flotante para molvicstudios.pro

El archivo `snippet-boton-flotante.html` contiene el código HTML+CSS listo para pegar antes del `</body>` en la web principal. Muestra un botón vertical dorado en el borde derecho que enlaza al Gabinete.

## 🛠️ Stack técnico

- **Frontend:** HTML5 + CSS3 + JavaScript ES Modules (vanilla)
- **IA:** Groq API con modelo `llama-3.3-70b-versatile`
- **Tipografías:** Google Fonts (Cinzel Decorative, IM Fell English, Playfair Display, Lora, UnifrakturMaguntia, Crimson Text, Cormorant Garamond, Libre Baskerville, Almendra Display, Syne)
- **Hosting:** Cloudflare Pages

## 📝 Desarrollo local

Sirve la carpeta con cualquier servidor HTTP estático:

```bash
# Con Python
cd gabinete && python3 -m http.server 8080

# Con Node.js (npx)
npx serve gabinete

# Con VS Code Live Server
# Click derecho en index.html → "Open with Live Server"
```

Abre `http://localhost:8080` en tu navegador.
