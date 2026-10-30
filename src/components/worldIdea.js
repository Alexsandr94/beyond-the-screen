// Сохранённая идея пригодится для связи со следующими локациями.
export const IDEA_KEY = 'beyond-the-screen.idea.v1';
export const ELEMENTS = ['heading', 'text', 'button'];
export const EMPTY_IDEA = { elements: [], theme: 'moon', action: 'portal', styled: false, wired: false, completed: false };
export function readIdea() {
  try {
    const data = JSON.parse(localStorage.getItem(IDEA_KEY));
    if (!data || !Array.isArray(data.elements)) return { ...EMPTY_IDEA };
    const elements = ELEMENTS.filter(name => data.elements.includes(name));
    const full = elements.length === 3;
    return { elements,
      theme: ['moon', 'forest', 'sun'].includes(data.theme) ? data.theme : 'moon',
      action: ['portal', 'stars'].includes(data.action) ? data.action : 'portal',
      styled: full && data.styled === true, wired: full && data.wired === true,
      completed: full && data.wired === true && data.completed === true,
    };
  } catch { return { ...EMPTY_IDEA }; }
}

export const IDEA_EVENT = 'beyond:idea-changed';
// Обновляем другие локации и при запрете хранилища браузером.
export function writeIdea(idea) {
  let saved = true;
  try { localStorage.setItem(IDEA_KEY, JSON.stringify(idea)); }
  catch { saved = false; }
  window.dispatchEvent(new CustomEvent(IDEA_EVENT, { detail: idea }));
  return saved;
}
