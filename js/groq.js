// groq.js — Cliente Groq para artefactos.pro
// Namespace propio: artefactos_groq_key (no colisiona con gabinete_groq_key)

const STORAGE_KEY = 'artefactos_groq_key';

/** Guarda la clave API en localStorage */
export function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/** Obtiene la clave API almacenada */
export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

/** Elimina la clave API */
export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Comprueba si hay clave guardada */
export function hasApiKey() {
  return !!getApiKey();
}

/**
 * Envía una petición al API de Groq
 * @param {Object} opciones - systemPrompt, userMessage, temperature, maxTokens
 * @returns {Promise<string>} Respuesta del modelo
 */
export async function askGroq({ systemPrompt, userMessage, temperature = 0.85, maxTokens = 600 }) {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error('NO_KEY');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const err = await response.json();
    if (response.status === 401) {
      clearApiKey();
      throw new Error('INVALID_KEY');
    }
    throw new Error(err.error?.message || 'Error en Groq API');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
