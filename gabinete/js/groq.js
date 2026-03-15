// js/groq.js — Cliente Groq reutilizable para todos los artefactos
// Todas las llamadas a la API de Groq pasan por este módulo

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Realiza una consulta a la API de Groq
 * @param {Object} params - Parámetros de la consulta
 * @param {string} params.systemPrompt - Instrucciones del sistema para el modelo
 * @param {string} params.userMessage - Mensaje del usuario
 * @param {Array} [params.messages] - Historial de mensajes (alternativa a systemPrompt+userMessage)
 * @param {number} [params.temperature=0.85] - Creatividad de la respuesta (0-2)
 * @param {number} [params.maxTokens=600] - Máximo de tokens en la respuesta
 * @returns {Promise<string>} Respuesta del modelo
 */
/**
 * Obtiene la API Key guardada en localStorage
 * @returns {string}
 */
export function getGroqKey() {
  return localStorage.getItem('gabinete-groq-key') || '';
}

/**
 * Guarda la API Key en localStorage
 * @param {string} key
 */
export function setGroqKey(key) {
  localStorage.setItem('gabinete-groq-key', key.trim());
}

/**
 * Comprueba si hay una API Key configurada
 * @returns {boolean}
 */
export function hasGroqKey() {
  const key = getGroqKey();
  return key.length > 0;
}

export async function askGroq({ systemPrompt, userMessage, messages, temperature = 0.85, maxTokens = 600 }) {
  const API_KEY = getGroqKey();

  if (!API_KEY) {
    throw new Error('API_KEY_MISSING');
  }

  // Construir mensajes: si se pasa historial usarlo, si no construir desde system+user
  const msgPayload = messages
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: msgPayload,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error en Groq API (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
