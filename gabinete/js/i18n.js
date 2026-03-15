// js/i18n.js — Sistema de traducciones ES/EN para el Gabinete de Curiosidades

export const translations = {
  es: {
    // Galería principal
    title: "Gabinete de Curiosidades",
    subtitle: "Una colección de mentes artificiales por MolvicStudios",
    selectLang: "EN",
    backBtn: "← Volver al Gabinete",
    loading: "Invocando sabiduría...",
    errorMsg: "Error al conectar con la API. Verifica tu clave Groq.",
    enterBtn: "Entrar",
    footer: "© MolvicStudios.pro — Experiencias construidas con Groq + LLaMA 3.3",
    copyBtn: "Copiar",
    copiedBtn: "¡Copiado!",

    // API Key
    apikey_btn: "🔑 API Key",
    apikey_title: "Clave API de Groq",
    apikey_desc: "Pega tu API Key de Groq para activar las experiencias.",
    apikey_placeholder: "gsk_...",
    apikey_save: "Guardar",
    apikey_saved: "✓ Clave guardada",
    apikey_get: "Obtener API Key gratis →",
    apikey_remove: "Borrar clave",
    apikey_status_ok: "✓ Clave configurada",
    apikey_status_missing: "⚠ Sin clave API",
    apikey_needed: "Necesitas una API Key de Groq para usar este artefacto.",

    // Artefacto 1: Oráculo
    oraculo_name: "El Oráculo de Delfos",
    oraculo_desc: "Consulta a la Pitia. Recibirás verdad envuelta en misterio.",
    oraculo_placeholder: "Escribe tu pregunta al Oráculo...",
    oraculo_ask: "Consultar al Oráculo",
    oraculo_new: "Nueva consulta",
    oraculo_inscriptions: "Inscripciones anteriores",

    // Artefacto 2: MusicSage
    musicsage_name: "MusicSage",
    musicsage_desc: "El sabio de la música. Teoría, historia y alma sonora.",
    musicsage_placeholder: "Pregunta sobre música...",
    musicsage_send: "Enviar",
    musicsage_suggestion1: "¿Qué es el modo dórico?",
    musicsage_suggestion2: "Historia del jazz",
    musicsage_suggestion3: "¿Por qué suena triste el modo menor?",
    musicsage_suggestion4: "Explica la forma sonata",
    musicsage_suggestion5: "Orígenes del blues",

    // Artefacto 3: Alquimista
    alquimista_name: "El Alquimista",
    alquimista_desc: "Filosofía hermética y ciencia antigua fundidas en diálogo.",
    alquimista_placeholder: "Pregunta al Alquimista...",
    alquimista_send: "Preguntar",
    alquimista_grimoire: "Grimorio",
    alquimista_symbol: "Símbolo del día",

    // Artefacto 4: Duelo
    duelo_name: "Duelo de Filósofos",
    duelo_desc: "Enfrenta a dos grandes mentes. Tú eliges el ring y el tema.",
    duelo_select_a: "Filósofo A",
    duelo_select_b: "Filósofo B",
    duelo_topic: "Tema del debate",
    duelo_topic_placeholder: "Ej: ¿Existe el libre albedrío?",
    duelo_start: "¡Que comience el duelo!",
    duelo_next_round: "Siguiente ronda",
    duelo_verdict: "Veredicto del árbitro",
    duelo_round: "Ronda",
    duelo_of: "de",
    duelo_new: "Nuevo duelo",

    // Artefacto 5: Scriptorium
    scriptorium_name: "El Scriptorium",
    scriptorium_desc: "Transforma cualquier texto en voz de otra época.",
    scriptorium_input_label: "Tu texto original",
    scriptorium_input_placeholder: "Pega o escribe tu texto aquí (máx. 500 palabras)...",
    scriptorium_output_label: "Texto transformado",
    scriptorium_select_era: "Elige una época",
    scriptorium_transform: "Transformar",
    scriptorium_era_medieval: "Medieval",
    scriptorium_era_renaissance: "Renacimiento",
    scriptorium_era_enlightenment: "Iluminismo",
    scriptorium_era_romanticism: "Romanticismo",
    scriptorium_era_beat: "Modernismo Beat",
    scriptorium_era_cyberpunk: "Cyberpunk Poético",
    scriptorium_history: "Transformaciones anteriores",
    scriptorium_words: "palabras",

    // --- TANDA 2 ---
    // Artefacto 6: Máquina del Tiempo
    maquina_name: "Máquina del Tiempo",
    maquina_desc: "Elige una época y vívela. Historia inmersiva en tiempo real.",
    maquina_select_era: "Elige una época",
    maquina_role_placeholder: "¿Quién quieres ser? (opcional: campesino, noble, soldado...)",
    maquina_start: "Viajar",
    maquina_action: "Elige tu acción",
    maquina_turn: "Turno",
    maquina_of: "de",
    maquina_return: "Regresar al presente",
    maquina_summary: "Resumen del viaje",
    maquina_facts: "Datos históricos",
    maquina_new_trip: "Nuevo viaje",
    maquina_traveling: "Viajando en el tiempo...",

    // Artefacto 7: Gabinete de Objetos
    gabinete_obj_name: "Gabinete de Curiosidades",
    gabinete_obj_desc: "Objetos raros reales de la historia. Cada sesión, un misterio nuevo.",
    gabinete_obj_reveal: "Revelar",
    gabinete_obj_next: "Siguiente objeto",
    gabinete_obj_counter: "Objeto",
    gabinete_obj_of_inf: "de ∞",
    gabinete_obj_origin: "Origen",
    gabinete_obj_era: "Época",
    gabinete_obj_use: "Uso original",
    gabinete_obj_story: "Historia",
    gabinete_obj_anecdote: "Anécdota",
    gabinete_obj_location: "Dónde verlo hoy",
    gabinete_obj_rarity: "Rareza",
    gabinete_obj_loading: "Buscando objeto en la vitrina...",

    // Artefacto 8: Bestiario Digital
    bestiario_name: "Bestiario Digital",
    bestiario_desc: "Criaturas mitológicas del mundo. Su lore, su poder, su leyenda.",
    bestiario_search_placeholder: "Busca una criatura...",
    bestiario_random: "Criatura aleatoria",
    bestiario_search: "Buscar",
    bestiario_danger: "Peligro",
    bestiario_powers: "Poderes",
    bestiario_weaknesses: "Debilidades",
    bestiario_invoke: "Cómo invocarla",
    bestiario_protect: "Cómo protegerse",
    bestiario_texts: "Textos históricos",
    bestiario_habitat: "Hábitat",
    bestiario_culture: "Cultura",
    bestiario_explored: "Criaturas exploradas",
    bestiario_loading: "Consultando el bestiario...",

    // Artefacto 9: Mapa de Ideas
    mapa_name: "El Mapa de las Ideas",
    mapa_desc: "Grafo interactivo de conceptos filosóficos y científicos. Explora con un clic.",
    mapa_search_placeholder: "Busca un concepto...",
    mapa_search: "Añadir",
    mapa_reset: "Resetear grafo",
    mapa_random: "Exploración aleatoria",
    mapa_thinker: "Pensador principal",
    mapa_quote: "Cita",
    mapa_related: "Conceptos relacionados",
    mapa_loading: "Explorando el conocimiento...",
    mapa_close: "Cerrar",

    // Artefacto 10: Sinfonía Generativa
    sinfonia_name: "Sinfonía Generativa",
    sinfonia_desc: "La IA compone. El canvas interpreta. Escucha con los ojos.",
    sinfonia_select_mood: "Elige un estado",
    sinfonia_compose: "Componer",
    sinfonia_play: "▶ Reproducir",
    sinfonia_pause: "⏸ Pausar",
    sinfonia_new: "Nueva composición",
    sinfonia_meditation: "Modo meditación",
    sinfonia_volume: "Volumen",
    sinfonia_composer_note: "Nota del compositor",
    sinfonia_loading: "Componiendo...",
    sinfonia_mood_melancholy: "Melancolía",
    sinfonia_mood_euphoria: "Euforia",
    sinfonia_mood_mystery: "Misterio",
    sinfonia_mood_chaos: "Caos",
    sinfonia_mood_serenity: "Serenidad",
    sinfonia_mood_nostalgia: "Nostalgia",
    sinfonia_mood_terror: "Terror",
    sinfonia_mood_ecstasy: "Éxtasis",

    // API Key panel
    apikey_panel_title: "🔑 Clave API Requerida",
    apikey_panel_desc: "Para activar este artefacto necesitas una clave API gratuita de Groq.",
    apikey_panel_placeholder: "Pega tu clave API aquí (gsk_...)",
    apikey_panel_save: "Guardar y continuar",
    apikey_panel_get: "Obtener clave gratis en console.groq.com →",
    apikey_panel_change: "Cambiar clave API",
  },
  en: {
    // Galería principal
    title: "Cabinet of Curiosities",
    subtitle: "A collection of artificial minds by MolvicStudios",
    selectLang: "ES",
    backBtn: "← Back to Cabinet",
    loading: "Summoning wisdom...",
    errorMsg: "API connection error. Check your Groq key.",
    enterBtn: "Enter",
    footer: "© MolvicStudios.pro — Experiences built with Groq + LLaMA 3.3",
    copyBtn: "Copy",
    copiedBtn: "Copied!",

    // API Key
    apikey_btn: "🔑 API Key",
    apikey_title: "Groq API Key",
    apikey_desc: "Paste your Groq API Key to activate the experiences.",
    apikey_placeholder: "gsk_...",
    apikey_save: "Save",
    apikey_saved: "✓ Key saved",
    apikey_get: "Get free API Key →",
    apikey_remove: "Remove key",
    apikey_status_ok: "✓ Key configured",
    apikey_status_missing: "⚠ No API key",
    apikey_needed: "You need a Groq API Key to use this artifact.",

    // Artefacto 1: Oráculo
    oraculo_name: "The Oracle of Delphi",
    oraculo_desc: "Consult the Pythia. Truth wrapped in mystery awaits.",
    oraculo_placeholder: "Write your question to the Oracle...",
    oraculo_ask: "Consult the Oracle",
    oraculo_new: "New consultation",
    oraculo_inscriptions: "Previous inscriptions",

    // Artefacto 2: MusicSage
    musicsage_name: "MusicSage",
    musicsage_desc: "The music sage. Theory, history and sonic soul.",
    musicsage_placeholder: "Ask about music...",
    musicsage_send: "Send",
    musicsage_suggestion1: "What is the Dorian mode?",
    musicsage_suggestion2: "History of jazz",
    musicsage_suggestion3: "Why does minor key sound sad?",
    musicsage_suggestion4: "Explain sonata form",
    musicsage_suggestion5: "Origins of the blues",

    // Artefacto 3: Alquimista
    alquimista_name: "The Alchemist",
    alquimista_desc: "Hermetic philosophy and ancient science fused in dialogue.",
    alquimista_placeholder: "Ask the Alchemist...",
    alquimista_send: "Ask",
    alquimista_grimoire: "Grimoire",
    alquimista_symbol: "Symbol of the day",

    // Artefacto 4: Duelo
    duelo_name: "Philosophers' Duel",
    duelo_desc: "Pit two great minds against each other. You pick the arena.",
    duelo_select_a: "Philosopher A",
    duelo_select_b: "Philosopher B",
    duelo_topic: "Debate topic",
    duelo_topic_placeholder: "E.g.: Does free will exist?",
    duelo_start: "Let the duel begin!",
    duelo_next_round: "Next round",
    duelo_verdict: "Arbiter's verdict",
    duelo_round: "Round",
    duelo_of: "of",
    duelo_new: "New duel",

    // Artefacto 5: Scriptorium
    scriptorium_name: "The Scriptorium",
    scriptorium_desc: "Transform any text into the voice of another era.",
    scriptorium_input_label: "Your original text",
    scriptorium_input_placeholder: "Paste or write your text here (max 500 words)...",
    scriptorium_output_label: "Transformed text",
    scriptorium_select_era: "Choose an era",
    scriptorium_transform: "Transform",
    scriptorium_era_medieval: "Medieval",
    scriptorium_era_renaissance: "Renaissance",
    scriptorium_era_enlightenment: "Enlightenment",
    scriptorium_era_romanticism: "Romanticism",
    scriptorium_era_beat: "Beat Modernism",
    scriptorium_era_cyberpunk: "Poetic Cyberpunk",
    scriptorium_history: "Previous transformations",
    scriptorium_words: "words",

    // --- TANDA 2 ---
    // Artefacto 6: Time Machine
    maquina_name: "Time Machine",
    maquina_desc: "Choose an era and live it. Immersive history in real time.",
    maquina_select_era: "Choose an era",
    maquina_role_placeholder: "Who do you want to be? (optional: peasant, noble, soldier...)",
    maquina_start: "Travel",
    maquina_action: "Choose your action",
    maquina_turn: "Turn",
    maquina_of: "of",
    maquina_return: "Return to the present",
    maquina_summary: "Trip summary",
    maquina_facts: "Historical facts",
    maquina_new_trip: "New trip",
    maquina_traveling: "Traveling through time...",

    // Artefacto 7: Cabinet of Curiosities
    gabinete_obj_name: "Cabinet of Curiosities",
    gabinete_obj_desc: "Real rare objects from history. Every session, a new mystery.",
    gabinete_obj_reveal: "Reveal",
    gabinete_obj_next: "Next object",
    gabinete_obj_counter: "Object",
    gabinete_obj_of_inf: "of ∞",
    gabinete_obj_origin: "Origin",
    gabinete_obj_era: "Era",
    gabinete_obj_use: "Original use",
    gabinete_obj_story: "History",
    gabinete_obj_anecdote: "Anecdote",
    gabinete_obj_location: "Where to see it today",
    gabinete_obj_rarity: "Rarity",
    gabinete_obj_loading: "Searching the display case...",

    // Artefacto 8: Digital Bestiary
    bestiario_name: "Digital Bestiary",
    bestiario_desc: "Mythological creatures of the world. Their lore, power and legend.",
    bestiario_search_placeholder: "Search for a creature...",
    bestiario_random: "Random creature",
    bestiario_search: "Search",
    bestiario_danger: "Danger",
    bestiario_powers: "Powers",
    bestiario_weaknesses: "Weaknesses",
    bestiario_invoke: "How to invoke",
    bestiario_protect: "How to protect yourself",
    bestiario_texts: "Historical texts",
    bestiario_habitat: "Habitat",
    bestiario_culture: "Culture",
    bestiario_explored: "Explored creatures",
    bestiario_loading: "Consulting the bestiary...",

    // Artefacto 9: Map of Ideas
    mapa_name: "The Map of Ideas",
    mapa_desc: "Interactive graph of philosophical and scientific concepts. Click to explore.",
    mapa_search_placeholder: "Search for a concept...",
    mapa_search: "Add",
    mapa_reset: "Reset graph",
    mapa_random: "Random exploration",
    mapa_thinker: "Main thinker",
    mapa_quote: "Quote",
    mapa_related: "Related concepts",
    mapa_loading: "Exploring knowledge...",
    mapa_close: "Close",

    // Artefacto 10: Generative Symphony
    sinfonia_name: "Generative Symphony",
    sinfonia_desc: "The AI composes. The canvas interprets. Listen with your eyes.",
    sinfonia_select_mood: "Choose a mood",
    sinfonia_compose: "Compose",
    sinfonia_play: "▶ Play",
    sinfonia_pause: "⏸ Pause",
    sinfonia_new: "New composition",
    sinfonia_meditation: "Meditation mode",
    sinfonia_volume: "Volume",
    sinfonia_composer_note: "Composer's note",
    sinfonia_loading: "Composing...",
    sinfonia_mood_melancholy: "Melancholy",
    sinfonia_mood_euphoria: "Euphoria",
    sinfonia_mood_mystery: "Mystery",
    sinfonia_mood_chaos: "Chaos",
    sinfonia_mood_serenity: "Serenity",
    sinfonia_mood_nostalgia: "Nostalgia",
    sinfonia_mood_terror: "Terror",
    sinfonia_mood_ecstasy: "Ecstasy",

    // API Key panel
    apikey_panel_title: "🔑 API Key Required",
    apikey_panel_desc: "To activate this artifact you need a free Groq API key.",
    apikey_panel_placeholder: "Paste your API key here (gsk_...)",
    apikey_panel_save: "Save and continue",
    apikey_panel_get: "Get free key at console.groq.com →",
    apikey_panel_change: "Change API key",
  }
};

/**
 * Obtiene el idioma actual desde localStorage o usa 'es' por defecto
 * @returns {'es'|'en'}
 */
export function getLang() {
  return localStorage.getItem('gabinete-lang') || 'es';
}

/**
 * Establece el idioma actual y lo guarda en localStorage
 * @param {'es'|'en'} lang
 */
export function setLang(lang) {
  localStorage.setItem('gabinete-lang', lang);
}

/**
 * Obtiene un texto traducido por clave
 * @param {string} key - Clave de traducción
 * @param {string} [lang] - Idioma (si no se pasa, usa el actual)
 * @returns {string}
 */
export function t(key, lang) {
  const currentLang = lang || getLang();
  return translations[currentLang]?.[key] || key;
}
