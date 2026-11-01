/* =========================================================================
   DUOLOGIC — app.js
   Aplicação estática de Lógica Proposicional (HTML + CSS + JS puro).
   Módulos:
     1. Armazenamento (localStorage) e progresso persistente
     2. Navegação por abas (com acessibilidade por teclado)
     3. Modo escuro
     4. Lições 1 a 11 (conteúdo completo)
     5. Verificação dos exercícios das lições
     6. Exercícios da seção #exercises (14 exercícios, gabaritados)
     7. Conquistas (badges reais com animação)
     8. Barra de progresso das lições
     9. Gerador de tabelas-verdade (parser com precedência + aliases + erros amigáveis)
    10. Modo competitivo gamificado (5 desafios rotativos, streak, histórico)
   ========================================================================= */

/* =========================================================================
   1. ARMAZENAMENTO E PROGRESSO PERSISTENTE
   ========================================================================= */

const STORAGE_KEY = 'dologic:state:v1';

// Estado padrão (usado na primeira visita ou se o storage estiver vazio/corrompido).
const DEFAULT_STATE = {
    completedLessons: [],          // números das lições concluídas
    correctExercises: [],          // números dos exercícios acertados
    attemptedExercises: [],        // números dos exercícios já tentados (para taxa de acerto)
    score: 0,                      // pontuação total do usuário
    achievements: [],              // ids das conquistas desbloqueadas
    challengeHistory: [],          // registros do modo competitivo
    bestStreak: 0,                 // maior sequência de acertos em desafios
    darkMode: false                // preferência do modo escuro
};

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
        const parsed = JSON.parse(raw);
        // Merge defensivo: garante que chaves novas existam mesmo em estados antigos.
        return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
    } catch (error) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        /* armazenamento indisponível (modo privado etc.) — app segue funcionando em memória */
    }
}

let state = loadState();

// Helpers de progresso usados por várias funções.
function addCompletedLesson(n) {
    if (!state.completedLessons.includes(n)) {
        state.completedLessons.push(n);
        state.score += 20; // pequena recompensa por conclusão de lição
        saveState();
        renderProgressUI();
        checkAchievements();
    }
}

function isExerciseCorrect(n) {
    return state.correctExercises.includes(n);
}

function markExerciseCorrect(n) {
    if (!isExerciseCorrect(n)) {
        state.correctExercises.push(n);
        state.score += 30;
        saveState();
        renderProgressUI();
        checkAchievements();
    }
}

function markExerciseAttempted(n) {
    if (!state.attemptedExercises.includes(n)) {
        state.attemptedExercises.push(n);
        saveState();
        renderProgressUI();
    }
}

/* =========================================================================
   2. NAVEGAÇÃO POR ABAS (com suporte a teclado — WCAG 2.1 AA)
   ========================================================================= */

function showTab(tabId) {
    const target = document.getElementById(tabId);
    if (!target || !target.classList.contains('tab-content')) return;

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab === target);
    });

    document.querySelectorAll('.tab-btn').forEach(button => {
        const isActive = button.getAttribute('data-tab') === tabId;
        button.classList.toggle('bg-indigo-800', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1; // roving tabindex para navegação por teclado
    });

    try { localStorage.setItem('currentTab', tabId); } catch (error) { /* opcional */ }
    if (tabId === 'competitive') startChallengeTimer();
}

// Navegação por teclado nas abas: setas, Home e End (padrão WAI-ARIA tabs).
function handleTabKeydown(event) {
    const buttons = [...document.querySelectorAll('.tab-btn')];
    const current = buttons.findIndex(b => b.getAttribute('aria-current') === 'page');
    let next = -1;
    switch (event.key) {
        case 'ArrowRight': next = (current + 1) % buttons.length; break;
        case 'ArrowLeft': next = (current - 1 + buttons.length) % buttons.length; break;
        case 'Home': next = 0; break;
        case 'End': next = buttons.length - 1; break;
        default: return;
    }
    event.preventDefault();
    const tabId = buttons[next].getAttribute('data-tab');
    showTab(tabId);
    buttons[next].focus();
}

/* =========================================================================
   3. MODO ESCURO
   ========================================================================= */

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    applyDarkMode();
    saveState();
}

function applyDarkMode() {
    document.body.classList.toggle('dark', state.darkMode);
    const button = document.getElementById('dark-mode-toggle');
    if (button) {
        const icon = button.querySelector('i');
        if (icon) icon.className = state.darkMode ? 'fas fa-sun mr-2' : 'fas fa-moon mr-2';
        button.setAttribute('aria-pressed', String(state.darkMode));
        button.setAttribute('title', state.darkMode ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
}

/* =========================================================================
   4. LIÇÕES 1 A 11
   ========================================================================= */

function showLesson(lessonNumber) {
    const lessonContent = document.getElementById('lesson-content');
    const lessons = getLessons();
    const selectedLesson = lessons[lessonNumber];
    if (!selectedLesson || !lessonContent) return;

    lessonContent.innerHTML = selectedLesson.content;

    // Destaca o botão da lição ativa na lista lateral.
    document.querySelectorAll('#lessons button[onclick^="showLesson"]').forEach(button => {
        const active = button.getAttribute('onclick') === `showLesson(${lessonNumber})`;
        button.classList.toggle('bg-indigo-100', active);
        button.classList.toggle('font-semibold', active);
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
    });

    // Marca visualmente as lições já concluídas.
    document.querySelectorAll('#lessons .lesson-check').forEach(span => {
        const num = Number(span.getAttribute('data-lesson'));
        span.hidden = !state.completedLessons.includes(num);
    });

    // Move o foco para o conteúdo (útil para leitores de tela e navegação por teclado).
    lessonContent.setAttribute('tabindex', '-1');
    lessonContent.focus({ preventScroll: true });
}

function getLessons() {
    return {
        1: {
            title: "Introdução à Lógica",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Introdução à Lógica</h2>
                <p class="text-gray-600 mb-4">A lógica proposicional, também conhecida como lógica de ordem zero, é o ramo mais básico da lógica matemática. Ela lida com proposições que podem ser verdadeiras ou falsas, e como essas proposições podem ser combinadas ou modificadas por meio de conectivos lógicos.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">O que é uma proposição?</h3>
                    <p class="text-gray-600">Uma <span class="glossary-term" tabindex="0">proposição<span class="glossary-tooltip">Declaração que pode ser claramente classificada como verdadeira ou falsa</span></span> é uma sentença declarativa que pode ser classificada como verdadeira (V) ou falsa (F), mas não ambas.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos de Proposições</h3>
                <ul class="list-disc pl-5 space-y-2 mb-4">
                    <li class="text-gray-600">"A neve é branca." (Verdadeira)</li>
                    <li class="text-gray-600">"2 + 2 = 5" (Falsa)</li>
                    <li class="text-gray-600">"Brasília é a capital do Brasil." (Verdadeira)</li>
                </ul>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">O que não é uma proposição?</h3>
                <ul class="list-disc pl-5 space-y-2">
                    <li class="text-gray-600">Perguntas: "Que horas são?"</li>
                    <li class="text-gray-600">Exclamações: "Que dia lindo!"</li>
                    <li class="text-gray-600">Ordens: "Feche a porta."</li>
                    <li class="text-gray-600">Sentenças vagas: "Ele é alto." (Depende de quem é "ele")</li>
                </ul>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Quais das seguintes sentenças são proposições?</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as sentenças que são proposições</legend>
                        <div class="flex items-center">
                            <input type="checkbox" id="lp1" class="mr-2">
                            <label for="lp1" class="cursor-pointer">A lua é feita de queijo.</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="lp2" class="mr-2">
                            <label for="lp2" class="cursor-pointer">Estude lógica proposicional.</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="lp3" class="mr-2">
                            <label for="lp3" class="cursor-pointer">x + 3 = 10</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="lp4" class="mr-2">
                            <label for="lp4" class="cursor-pointer">Todo número par maior que 2 pode ser expresso como a soma de dois números primos.</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(1)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson1-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        2: {
            title: "Proposições Simples",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Proposições Simples</h2>
                <p class="text-gray-600 mb-4">Proposições simples (ou <span class="glossary-term" tabindex="0">atômicas<span class="glossary-tooltip">Proposições que não contêm conectivos lógicos e não podem ser divididas em partes menores que ainda sejam proposições</span></span>) são aquelas que não podem ser divididas em partes menores que ainda sejam proposições. Elas representam as unidades básicas da lógica proposicional.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Características das Proposições Simples</h3>
                    <ul class="list-disc pl-5 space-y-1">
                        <li class="text-gray-600">Não contêm conectivos lógicos</li>
                        <li class="text-gray-600">São indivisíveis em partes menores que sejam proposições</li>
                        <li class="text-gray-600">São representadas por letras minúsculas (p, q, r, etc.)</li>
                    </ul>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposição em Português</h4>
                        <p class="text-gray-600">"Está chovendo."</p>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Representação Simbólica</h4>
                        <p class="text-gray-600">p</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposição em Português</h4>
                        <p class="text-gray-600">"O sol é uma estrela."</p>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Representação Simbólica</h4>
                        <p class="text-gray-600">q</p>
                    </div>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Cada caixa deve receber UMA letra diferente (p, q ou r) que simboliza a proposição ao lado:</p>
                    <div class="space-y-3">
                        <div>
                            <label for="l2fill1" class="text-gray-700 block mb-1">"O gato está dormindo."</label>
                            <input type="text" id="l2fill1" class="border rounded p-2 w-16 text-center" placeholder="letra" maxlength="1" aria-describedby="l2help">
                        </div>
                        <div>
                            <label for="l2fill2" class="text-gray-700 block mb-1">"A aula começou."</label>
                            <input type="text" id="l2fill2" class="border rounded p-2 w-16 text-center" placeholder="letra" maxlength="1">
                        </div>
                        <div>
                            <label for="l2fill3" class="text-gray-700 block mb-1">"O Brasil é um país tropical."</label>
                            <input type="text" id="l2fill3" class="border rounded p-2 w-16 text-center" placeholder="letra" maxlength="1">
                        </div>
                    </div>
                    <p id="l2help" class="text-sm text-gray-500 italic mt-2">Dica: use letras diferentes para proposições diferentes — por exemplo, p, q e r.</p>
                    <button onclick="checkLessonExercise(2)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson2-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        3: {
            title: "Negação (¬)",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Negação (¬)</h2>
                <p class="text-gray-600 mb-4">A negação é um dos conectivos lógicos mais simples e importantes da lógica proposicional. Ela inverte o valor lógico de uma proposição.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Como funciona a negação?</h3>
                    <p class="text-gray-600">Se uma proposição é verdadeira (V), sua negação será falsa (F). Se for falsa, sua negação será verdadeira. O símbolo utilizado para a negação é <strong>¬</strong>.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposição</h4>
                        <p class="text-gray-600">"Está chovendo."</p>
                        <p class="text-gray-600 italic">Representação: p</p>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Negação</h4>
                        <p class="text-gray-600">"Não está chovendo."</p>
                        <p class="text-gray-600 italic">Representação: ¬p</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposição</h4>
                        <p class="text-gray-600">"O Brasil fica na Europa."</p>
                        <p class="text-gray-600 italic">Representação: q</p>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Negação</h4>
                        <p class="text-gray-600">"O Brasil não fica na Europa."</p>
                        <p class="text-gray-600 italic">Representação: ¬q</p>
                    </div>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Selecione as alternativas que representam negações corretas:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as negações corretas</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l3ex1" class="mr-2 mt-1">
                            <label for="l3ex1" class="cursor-pointer">Proposição: "O sol nasceu." | Negação: "O sol não nasceu."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l3ex2" class="mr-2 mt-1">
                            <label for="l3ex2" class="cursor-pointer">Proposição: "Maria é médica." | Negação: "Maria é engenheira."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l3ex3" class="mr-2 mt-1">
                            <label for="l3ex3" class="cursor-pointer">Proposição: "2 + 2 = 5" | Negação: "2 + 2 ≠ 5"</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l3ex4" class="mr-2 mt-1">
                            <label for="l3ex4" class="cursor-pointer">Proposição: "Está frio." | Negação: "Está calor."</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(3)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson3-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        4: {
            title: "Conjunção (∧)",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Conjunção (∧)</h2>
                <p class="text-gray-600 mb-4">A conjunção é um conectivo lógico que une duas proposições e resulta em uma nova proposição que só é verdadeira se ambas as proposições forem verdadeiras.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Como funciona a conjunção?</h3>
                    <p class="text-gray-600">Usamos o símbolo <strong>∧</strong> para representar a conjunção. A proposição <em>p ∧ q</em> será verdadeira somente se <em>p</em> e <em>q</em> forem ambas verdadeiras.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposições Individuais</h4>
                        <ul class="text-gray-600 list-disc ml-4">
                            <li>p: "Está ensolarado."</li>
                            <li>q: "Hoje é segunda-feira."</li>
                        </ul>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Conjunção</h4>
                        <p class="text-gray-600">"Está ensolarado <strong>e</strong> hoje é segunda-feira."</p>
                        <p class="text-gray-600 italic">Representação: p ∧ q</p>
                    </div>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Observação</h4>
                    <p class="text-gray-600">Se <em>p</em> for verdadeira e <em>q</em> for falsa, a conjunção <em>p ∧ q</em> será falsa.</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Selecione as frases que exprimem uma conjunção lógica (uso do conectivo "e" entre duas proposições):</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as conjunções válidas</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l4ex1" class="mr-2 mt-1">
                            <label for="l4ex1" class="cursor-pointer">"O cachorro latiu e o gato miou."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l4ex2" class="mr-2 mt-1">
                            <label for="l4ex2" class="cursor-pointer">"Ou você estuda, ou você trabalha."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l4ex3" class="mr-2 mt-1">
                            <label for="l4ex3" class="cursor-pointer">"Pedro correu e Maria chegou."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l4ex4" class="mr-2 mt-1">
                            <label for="l4ex4" class="cursor-pointer">"Está calor, mas pode chover."</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(4)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson4-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        5: {
            title: "Disjunção (∨)",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Disjunção (∨)</h2>
                <p class="text-gray-600 mb-4">A disjunção é um conectivo lógico que une duas proposições e resulta em uma nova proposição que é verdadeira se pelo menos uma das proposições for verdadeira.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Como funciona a disjunção?</h3>
                    <p class="text-gray-600">Usamos o símbolo <strong>∨</strong> para indicar a disjunção. A proposição <em>p ∨ q</em> será falsa apenas quando <em>p</em> e <em>q</em> forem ambas falsas.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Proposições Individuais</h4>
                        <ul class="text-gray-600 list-disc ml-4">
                            <li>p: "Pedro está em casa."</li>
                            <li>q: "João está na escola."</li>
                        </ul>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <h4 class="font-medium text-gray-700 mb-1">Disjunção</h4>
                        <p class="text-gray-600">"Pedro está em casa <strong>ou</strong> João está na escola."</p>
                        <p class="text-gray-600 italic">Representação: p ∨ q</p>
                    </div>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Importante</h4>
                    <p class="text-gray-600">Na lógica proposicional, a disjunção é <span class="glossary-term" tabindex="0">inclusiva<span class="glossary-tooltip">Disjunção verdadeira quando pelo menos uma das proposições é verdadeira — inclusive quando ambas são</span></span>, ou seja, considera-se verdadeira se uma ou ambas as proposições forem verdadeiras.</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Selecione as frases que representam disjunções lógicas inclusivas:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as disjunções</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l5ex1" class="mr-2 mt-1">
                            <label for="l5ex1" class="cursor-pointer">"O aluno passou ou ele estudou muito."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l5ex2" class="mr-2 mt-1">
                            <label for="l5ex2" class="cursor-pointer">"Se chover, não sairei."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l5ex3" class="mr-2 mt-1">
                            <label for="l5ex3" class="cursor-pointer">"Ana viajou e levou o cachorro."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l5ex4" class="mr-2 mt-1">
                            <label for="l5ex4" class="cursor-pointer">"Posso tomar café ou chá."</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(5)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson5-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        6: {
            title: "Condicional (→)",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Condicional (→)</h2>
                <p class="text-gray-600 mb-4">A condicional é um conectivo lógico que expressa uma relação de implicação entre duas proposições. É representada por <strong>→</strong> e lida como "se... então...".</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Como funciona a condicional?</h3>
                    <p class="text-gray-600">Na proposição <em>p → q</em>, se <em>p</em> for verdadeira e <em>q</em> for falsa, a condicional é falsa. Em todos os outros casos, é verdadeira.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplo em linguagem natural</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <p class="text-gray-600"><strong>p:</strong> "Estudo lógica."</p>
                        <p class="text-gray-600"><strong>q:</strong> "Passo na prova."</p>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-gray-200">
                        <p class="text-gray-600">"Se estudo lógica, então passo na prova."</p>
                        <p class="text-gray-600 italic">Representação: p → q</p>
                    </div>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Importante</h4>
                    <p class="text-gray-600">A condicional não afirma que <em>p</em> ou <em>q</em> são verdadeiros isoladamente, mas sim que, se <em>p</em> for verdadeira, então <em>q</em> deve ser também. Chamamos <em>p</em> de <span class="glossary-term" tabindex="0">antecedente<span class="glossary-tooltip">A primeira proposição de uma condicional (p em p → q)</span></span> e <em>q</em> de <span class="glossary-term" tabindex="0">consequente<span class="glossary-tooltip">A segunda proposição de uma condicional (q em p → q)</span></span>.</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício 1 – Múltipla escolha</h3>
                    <p class="text-blue-700 mb-3">Qual frase representa corretamente uma condicional?</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Escolha a alternativa que representa uma condicional</legend>
                        <div class="flex items-start">
                            <input type="radio" id="l6ex1a" name="l6ex1" value="a" class="mr-2 mt-1">
                            <label for="l6ex1a" class="cursor-pointer">"Estudo lógica e passo na prova."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="radio" id="l6ex1b" name="l6ex1" value="b" class="mr-2 mt-1">
                            <label for="l6ex1b" class="cursor-pointer">"Estudo lógica ou passo na prova."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="radio" id="l6ex1c" name="l6ex1" value="c" class="mr-2 mt-1">
                            <label for="l6ex1c" class="cursor-pointer">"Se estudo lógica, então passo na prova."</label>
                        </div>
                        <div class="flex items-start">
                            <input type="radio" id="l6ex1d" name="l6ex1" value="d" class="mr-2 mt-1">
                            <label for="l6ex1d" class="cursor-pointer">"Não estudo lógica."</label>
                        </div>
                    </fieldset>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício 2 – Tradução simbólica</h3>
                    <p class="text-blue-700 mb-3">Traduza: "Se você estudar, então você aprenderá lógica." Use <strong>p</strong> para "você estudar" e <strong>q</strong> para "você aprenderá lógica".</p>
                    <label for="l6ex2" class="sr-only">Resposta em notação simbólica</label>
                    <input type="text" id="l6ex2" class="border rounded p-2 w-40 text-center" placeholder="Ex.: p -> q">
                    <p class="text-sm text-gray-500 italic mt-2">Dica: você pode digitar "p → q" ou usar o alias "p > q".</p>
                </div>

                <button onclick="checkLessonExercise(6)" class="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                <div id="lesson6-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
            `
        },
        7: {
            title: "Bicondicional (↔)",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Bicondicional (↔)</h2>
                <p class="text-gray-600 mb-4">A bicondicional combina duas condicionais: <em>p → q</em> e <em>q → p</em>. É representada por <strong>↔</strong> e lida como "<strong>se e somente se</strong>" (abreviada como "sse").</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Definição</h3>
                    <p class="text-gray-600 mb-2">A proposição <em>p ↔ q</em> é verdadeira quando <strong>p e q possuem o mesmo valor lógico</strong> — ambas verdadeiras ou ambas falsas — e é falsa quando elas diferem.</p>
                    <p class="text-gray-600">Formalmente: <em>p ↔ q ≡ (p → q) ∧ (q → p)</em>. Por isso a bicondicional também é chamada de <span class="glossary-term" tabindex="0">dupla implicação<span class="glossary-tooltip">Conectivo que exige que cada proposição implique a outra: p ↔ q equivale a (p → q) ∧ (q → p)</span></span>.</p>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Tabela-verdade de p ↔ q</h3>
                <div class="overflow-x-auto mb-4">
                    <table class="truth-table max-w-md">
                        <thead>
                            <tr><th>p</th><th>q</th><th>p → q</th><th>q → p</th><th>p ↔ q</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>V</td><td>V</td><td>V</td><td>V</td><td class="font-semibold text-green-600">V</td></tr>
                            <tr><td>V</td><td>F</td><td>F</td><td>V</td><td class="font-semibold text-red-600">F</td></tr>
                            <tr><td>F</td><td>V</td><td>V</td><td>F</td><td class="font-semibold text-red-600">F</td></tr>
                            <tr><td>F</td><td>F</td><td>V</td><td>V</td><td class="font-semibold text-green-600">V</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos em linguagem natural</h3>
                <ul class="list-disc pl-5 space-y-2 mb-4">
                    <li class="text-gray-600">"Um triângulo é equilátero <strong>se e somente se</strong> ele é equiângulo."<br><span class="italic text-gray-500">p ↔ q — as duas propriedades andam sempre juntas.</span></li>
                    <li class="text-gray-600">"Você passará <strong>se e somente se</strong> você estudar."<br><span class="italic text-gray-500">Passar implica ter estudado, e estudar (de forma suficiente) implica passar.</span></li>
                </ul>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Sinônimos úteis</h4>
                    <p class="text-gray-600">"p é condição necessária e suficiente para q", "p ocorre exatamente quando q ocorre", "p caso e só caso q".</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Considere a bicondicional: "Estou satisfeito se, e somente se, o time vence." Selecione as interpretações corretas:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as interpretações corretas da bicondicional</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l7ex1" class="mr-2 mt-1">
                            <label for="l7ex1" class="cursor-pointer">Se o time vence, então estou satisfeito.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l7ex2" class="mr-2 mt-1">
                            <label for="l7ex2" class="cursor-pointer">Se estou satisfeito, então o time venceu.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l7ex3" class="mr-2 mt-1">
                            <label for="l7ex3" class="cursor-pointer">Quando o time perde, posso continuar satisfeito.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l7ex4" class="mr-2 mt-1">
                            <label for="l7ex4" class="cursor-pointer">A expressão equivale a (p → q) ∧ (q → p).</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(7)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson7-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        8: {
            title: "Tautologias, Contradições e Contingências",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Tautologias, Contradições e Contingências</h2>
                <p class="text-gray-600 mb-4">Nem toda fórmula depende do mundo para ter seu valor lógico determinado. Algumas são verdadeiras ou falsas <em>por pura forma</em>. Classificamos as fórmulas em três tipos segundo a última coluna da sua tabela-verdade.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Definições</h3>
                    <ul class="list-disc pl-5 space-y-2">
                        <li class="text-gray-600"><span class="glossary-term" tabindex="0">Tautologia<span class="glossary-tooltip">Fórmula sempre verdadeira, independentemente dos valores das variáveis — última coluna toda V</span></span>: fórmula verdadeira para <strong>todas</strong> as valorações. Exemplo clássico: <em>p ∨ ¬p</em> ("ou chove ou não chove").</li>
                        <li class="text-gray-600"><span class="glossary-term" tabindex="0">Contradição<span class="glossary-tooltip">Fórmula sempre falsa, independentemente dos valores das variáveis — última coluna toda F</span></span>: fórmula falsa para <strong>todas</strong> as valorações. Exemplo clássico: <em>p ∧ ¬p</em> ("chove e não chove").</li>
                        <li class="text-gray-600"><span class="glossary-term" tabindex="0">Contingência<span class="glossary-tooltip">Fórmula que pode ser verdadeira ou falsa, dependendo dos valores das variáveis</span></span>: fórmula nem sempre verdadeira, nem sempre falsa — seu valor <em>depende</em> das variáveis. Exemplo: <em>p → q</em>.</li>
                    </ul>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Exemplos demonstrados por tabela-verdade</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">p ∨ ¬p — Tautologia</h4>
                        <table class="truth-table">
                            <thead><tr><th>p</th><th>¬p</th><th>p ∨ ¬p</th></tr></thead>
                            <tbody>
                                <tr><td>V</td><td>F</td><td class="font-semibold text-green-600">V</td></tr>
                                <tr><td>F</td><td>V</td><td class="font-semibold text-green-600">V</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">p ∧ ¬p — Contradição</h4>
                        <table class="truth-table">
                            <thead><tr><th>p</th><th>¬p</th><th>p ∧ ¬p</th></tr></thead>
                            <tbody>
                                <tr><td>V</td><td>F</td><td class="font-semibold text-red-600">F</td></tr>
                                <tr><td>F</td><td>V</td><td class="font-semibold text-red-600">F</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Outros exemplos</h4>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1">
                        <li>Tautologias: <em>(p → q) ↔ (¬p ∨ q)</em>, <em>p → p</em>, <em>(p ∧ q) → p</em></li>
                        <li>Contradições: <em>(p ∨ q) ∧ ¬p ∧ ¬q</em>, <em>p ↔ ¬p</em></li>
                        <li>Contingências: <em>p ∧ q</em>, <em>p → q</em>, <em>p ∨ q</em></li>
                    </ul>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Dica de teste</h4>
                    <p class="text-gray-600">Gere a tabela-verdade no gerador desta aplicação: se a última coluna tiver apenas <strong>V</strong>, é tautologia; apenas <strong>F</strong>, contradição; uma mistura, contingência. O próprio gerador agora exibe a classificação automaticamente!</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Classifique cada fórmula. Marque as alternativas corretas:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as classificações corretas</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l8ex1" class="mr-2 mt-1">
                            <label for="l8ex1" class="cursor-pointer">"p ∨ ¬p" é uma tautologia.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l8ex2" class="mr-2 mt-1">
                            <label for="l8ex2" class="cursor-pointer">"p ∧ ¬p" é uma contradição.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l8ex3" class="mr-2 mt-1">
                            <label for="l8ex3" class="cursor-pointer">"p → q" é uma tautologia.</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l8ex4" class="mr-2 mt-1">
                            <label for="l8ex4" class="cursor-pointer">"(p ∧ q) → p" é uma tautologia.</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(8)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson8-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        9: {
            title: "Equivalências Lógicas",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Equivalências Lógicas</h2>
                <p class="text-gray-600 mb-4">Duas fórmulas são <span class="glossary-term" tabindex="0">logicamente equivalentes<span class="glossary-tooltip">Duas fórmulas que produzem a mesma coluna final na tabela-verdade para todas as valorações; escreve-se A ≡ B</span></span> quando possuem a mesma tabela-verdade, isto é, o mesmo valor lógico em todas as linhas. Escrevemos <em>A ≡ B</em>. Equivalências permitem reescrever fórmulas complexas em formas mais simples ou úteis.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Leis de De Morgan</h3>
                    <p class="text-gray-600 mb-2">As negações "distribuem" sobre conjunção e disjunção, trocando os conectivos:</p>
                    <ul class="list-disc pl-5 space-y-1 font-mono text-gray-800">
                        <li>¬(p ∧ q) ≡ ¬p ∨ ¬q</li>
                        <li>¬(p ∨ q) ≡ ¬p ∧ ¬q</li>
                    </ul>
                    <p class="text-gray-600 mt-2">Em linguagem natural: "não é verdade que estudo e trabalho" ≡ "ou não estudo, ou não trabalho".</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Dupla negação</h3>
                    <p class="text-gray-600 font-mono">¬¬p ≡ p</p>
                    <p class="text-gray-600 mt-1">Negar duas vezes é o mesmo que afirmar: "não é falso que chove" ≡ "chove".</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Condicional e contrapositiva</h3>
                    <ul class="list-disc pl-5 space-y-1">
                        <li class="text-gray-600"><span class="glossary-term" tabindex="0">Contrapositiva<span class="glossary-tooltip">A condicional ¬q → ¬p, que é logicamente equivalente a p → q</span></span>: <em class="font-mono">p → q ≡ ¬q → ¬p</em>. "Se estudo, passo" ≡ "se não passei, então não estudei".</li>
                        <li class="text-gray-600">Implicação material: <em class="font-mono">p → q ≡ ¬p ∨ q</em></li>
                        <li class="text-gray-600">Cuidado! A <span class="glossary-term" tabindex="0">recíproca<span class="glossary-tooltip">A condicional q → p; NÃO é equivalente a p → q</span></span> (q → p) e a <span class="glossary-term" tabindex="0">inversa<span class="glossary-tooltip">A condicional ¬p → ¬q; NÃO é equivalente a p → q</span></span> (¬p → ¬q) <strong>não</strong> são equivalentes à condicional original.</li>
                    </ul>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Leis distributivas</h3>
                    <ul class="list-disc pl-5 space-y-1 font-mono text-gray-800">
                        <li>p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)</li>
                        <li>p ∨ (q ∧ r) ≡ (p ∨ q) ∧ (p ∨ r)</li>
                    </ul>
                    <p class="text-gray-600 mt-2">Funcionam como a distributiva da álgebra — só que com ∧ e ∨ no lugar de × e +.</p>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Outras equivalências úteis</h4>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1 font-mono">
                        <li>Idempotência: p ∧ p ≡ p, p ∨ p ≡ p</li>
                        <li>Comutatividade: p ∧ q ≡ q ∧ p, p ∨ q ≡ q ∨ p</li>
                        <li>Bicondicional: p ↔ q ≡ (p → q) ∧ (q → p)</li>
                        <li>Absorção: p ∨ (p ∧ q) ≡ p</li>
                    </ul>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Selecione APENAS as equivalências verdadeiras:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque as equivalências corretas</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l9ex1" class="mr-2 mt-1">
                            <label for="l9ex1" class="cursor-pointer">¬(p ∧ q) ≡ ¬p ∨ ¬q</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l9ex2" class="mr-2 mt-1">
                            <label for="l9ex2" class="cursor-pointer">p → q ≡ ¬p → ¬q</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l9ex3" class="mr-2 mt-1">
                            <label for="l9ex3" class="cursor-pointer">p → q ≡ ¬q → ¬p</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l9ex4" class="mr-2 mt-1">
                            <label for="l9ex4" class="cursor-pointer">¬(p ∨ q) ≡ ¬p ∧ ¬q</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l9ex5" class="mr-2 mt-1">
                            <label for="l9ex5" class="cursor-pointer">p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(9)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson9-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        10: {
            title: "Argumentos Válidos",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Argumentos Válidos</h2>
                <p class="text-gray-600 mb-4">Um <span class="glossary-term" tabindex="0">argumento<span class="glossary-tooltip">Conjunto de premissas seguido de uma conclusão; é válido quando é impossível as premissas serem verdadeiras e a conclusão falsa</span></span> é composto por <strong>premissas</strong> (afirmações que assumimos verdadeiras) e uma <strong>conclusão</strong>. Ele é <span class="glossary-term" tabindex="0">válido<span class="glossary-tooltip">Propriedade estrutural: toda linha da tabela-verdade em que todas as premissas são V também tem conclusão V</span></span> quando é <em>impossível</em> que todas as premissas sejam verdadeiras e a conclusão falsa.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">Como testar a validade</h3>
                    <ol class="list-decimal pl-5 space-y-1 text-gray-600">
                        <li>Construa a tabela-verdade com uma coluna para cada premissa e uma para a conclusão.</li>
                        <li>Observe apenas as linhas em que <strong>todas</strong> as premissas são V.</li>
                        <li>Se em alguma dessas linhas a conclusão for F, o argumento é <strong>inválido</strong>. Caso contrário, é <strong>válido</strong>.</li>
                    </ol>
                </div>

                <h3 class="text-xl font-semibold text-gray-800 mb-3">Regras de inferência clássicas</h3>

                <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-2"><i class="fas fa-arrow-right text-indigo-600 mr-2" aria-hidden="true"></i>Modus Ponens (afirmar o antecedente)</h4>
                    <p class="text-gray-600 mb-2 font-mono">p → q, p ⊢ q</p>
                    <p class="text-gray-600">"Se estudo, então passo. Estudo. Logo, passo."</p>
                </div>

                <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-2"><i class="fas fa-ban text-indigo-600 mr-2" aria-hidden="true"></i>Modus Tollens (negar o consequente)</h4>
                    <p class="text-gray-600 mb-2 font-mono">p → q, ¬q ⊢ ¬p</p>
                    <p class="text-gray-600">"Se chove, a rua molha. A rua não molha. Logo, não chove."</p>
                </div>

                <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-2"><i class="fas fa-link text-indigo-600 mr-2" aria-hidden="true"></i>Silogismo Hipotético (transitividade)</h4>
                    <p class="text-gray-600 mb-2 font-mono">p → q, q → r ⊢ p → r</p>
                    <p class="text-gray-600">"Se estudo, aprendo. Se aprendo, passo. Logo, se estudo, passo."</p>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">Falácias comuns (formas inválidas)</h4>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1">
                        <li><span class="glossary-term" tabindex="0">Afirmação do consequente<span class="glossary-tooltip">Falácia: inferir p a partir de p → q e q. Exemplo inválido: "Se chove, a rua molha; a rua molha; logo, chove."</span></span>: p → q, q ⊬ p</li>
                        <li><span class="glossary-term" tabindex="0">Negação do antecedente<span class="glossary-tooltip">Falácia: inferir ¬q a partir de p → q e ¬p. Exemplo inválido: "Se chove, a rua molha; não chove; logo, a rua não molha."</span></span>: p → q, ¬p ⊬ ¬q</li>
                    </ul>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                    <p class="text-blue-700 mb-3">Analise cada argumento. Marque APENAS os argumentos VÁLIDOS:</p>
                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend class="sr-only">Marque os argumentos válidos</legend>
                        <div class="flex items-start">
                            <input type="checkbox" id="l10ex1" class="mr-2 mt-1">
                            <label for="l10ex1" class="cursor-pointer">Premissas: "Se corro, fico cansado" e "Corri". Conclusão: "Fico cansado".</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l10ex2" class="mr-2 mt-1">
                            <label for="l10ex2" class="cursor-pointer">Premissas: "Se sou aprovado, estudo" e "Sou aprovado". Conclusão: "Estudo".</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l10ex3" class="mr-2 mt-1">
                            <label for="l10ex3" class="cursor-pointer">Premissas: "Se treino, melhoro" e "Melhoro". Conclusão: "Treino".</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l10ex4" class="mr-2 mt-1">
                            <label for="l10ex4" class="cursor-pointer">Premissas: "Se fecho a loja, desligo a luz" e "Não desliguei a luz". Conclusão: "Não fechei a loja".</label>
                        </div>
                        <div class="flex items-start">
                            <input type="checkbox" id="l10ex5" class="mr-2 mt-1">
                            <label for="l10ex5" class="cursor-pointer">Premissas: "Se A então B" e "Se B então C". Conclusão: "Se A então C".</label>
                        </div>
                    </fieldset>
                    <button onclick="checkLessonExercise(10)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson10-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        },
        11: {
            title: "Aplicações Práticas",
            content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Aplicações Práticas</h2>
                <p class="text-gray-600 mb-4">A lógica proposicional não é apenas teoria: ela está embutida nos circuitos dos computadores, nas decisões do seu código, nas consultas a bancos de dados e até em protocolos de diagnóstico médico.</p>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2"><i class="fas fa-microchip text-indigo-600 mr-2" aria-hidden="true"></i>1. Circuitos digitais (portas lógicas)</h3>
                    <p class="text-gray-600 mb-2">Cada conectivo corresponde a uma <span class="glossary-term" tabindex="0">porta lógica<span class="glossary-tooltip">Circuito elementar (AND, OR, NOT etc.) que implementa um conectivo lógico sobre sinais elétricos 0/1</span></span>:</p>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1">
                        <li>∧ → porta AND (saída 1 somente com ambas as entradas 1)</li>
                        <li>∨ → porta OR (saída 1 se qualquer entrada for 1)</li>
                        <li>¬ → porta NOT (inverte o sinal)</li>
                    </ul>
                    <p class="text-gray-600 mt-2">A expressão <em>(A ∧ B) ∨ ¬C</em> vira literalmente um circuito. Simplificar com leis de equivalência reduz o número de portas — e o custo do chip.</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2"><i class="fas fa-code text-indigo-600 mr-2" aria-hidden="true"></i>2. Programação (if/else e operadores booleanos)</h3>
                    <p class="text-gray-600 mb-2">Em JavaScript, <code class="bg-gray-200 px-1 rounded">!</code> é ¬, <code class="bg-gray-200 px-1 rounded">&amp;&amp;</code> é ∧ e <code class="bg-gray-200 px-1 rounded">||</code> é ∨:</p>
                    <pre class="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto"><code>if (usuario.isAdulto &amp;&amp; !usuario.banido) {
    liberarAcesso();
}</code></pre>
                    <p class="text-gray-600 mt-2">A condicional do programa "se p então q" é exatamente o conectivo → estudado na lição 6.</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2"><i class="fas fa-database text-indigo-600 mr-2" aria-hidden="true"></i>3. Buscas em bancos de dados (SQL)</h3>
                    <p class="text-gray-600 mb-2">O WHERE de uma consulta SQL é uma fórmula proposicional avaliada linha a linha:</p>
                    <pre class="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto"><code>SELECT * FROM produtos
WHERE (categoria = 'livro' OR preco &lt; 50)
  AND NOT esgotado;</code></pre>
                    <p class="text-gray-600 mt-2">Errar o posicionamento de um <em>AND</em>/<em>OR</em> muda totalmente o resultado — precedência importa tanto quanto na matemática.</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-800 mb-2"><i class="fas fa-stethoscope text-indigo-600 mr-2" aria-hidden="true"></i>4. Diagnóstico médico e sistemas peritos</h3>
                    <p class="text-gray-600">Regras clínicas são condicionais encadeadas, exploradas por <span class="glossary-term" tabindex="0">sistemas especialistas<span class="glossary-tooltip">Programas que usam bases de regras (se... então...) para reproduzir o raciocínio de um especialista humano</span></span>:</p>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1">
                        <li>"Se febre ∧ tosse → suspeita de gripe"</li>
                        <li>"Se suspeita de gripe ∧ falta de ar → exames complementares"</li>
                        <li>O Modus Tollens aparece ao descartar hipóteses: "Se fosse dengue, a plaqueta estaria baixa; a plaqueta está normal; logo, provavelmente não é dengue."</li>
                    </ul>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                    <h4 class="font-medium text-gray-700 mb-1">E mais…</h4>
                    <p class="text-gray-600">Buscas na internet (operadores AND/OR/NOT), validação de formulários, contratos ("aprovado sse média ≥ 7"), inteligência artificial e verificação formal de hardware usam lógica proposicional diariamente.</p>
                </div>

                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático — Tradução</h3>
                    <p class="text-blue-700 mb-3">Escreva a expressão lógica correspondente à consulta: <em>"produtos da categoria livro OU com preço menor que 50"</em>, usando <strong>p</strong> para "é da categoria livro" e <strong>q</strong> para "custa menos de 50".</p>
                    <label for="l11ex1" class="sr-only">Sua tradução simbólica</label>
                    <input type="text" id="l11ex1" class="border rounded p-2 w-40 text-center" placeholder="Ex.: p | q">
                    <p class="text-sm text-gray-500 italic mt-2">Dica: o conectivo usado em buscas para "OU" pode ser digitado como "|" ou "∨".</p>
                    <button onclick="checkLessonExercise(11)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                    <div id="lesson11-feedback" class="mt-2 text-sm hidden" aria-live="polite"></div>
                </div>
            `
        }
    };
}

/* =========================================================================
   5. VERIFICAÇÃO DOS EXERCÍCIOS DAS LIÇÕES
   ========================================================================= */

// Helpers de feedback reutilizáveis (verde/vermelho com ícone Font Awesome).
function setFeedbackOK(element, message) {
    element.classList.remove('hidden');
    element.innerHTML = `
        <div class="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
            <i class="fas fa-check-circle mr-2" aria-hidden="true"></i>${message}
        </div>`;
    const card = element.closest('.bg-blue-50, .exercise-card, .bg-white');
    if (card) {
        card.classList.add('correct-answer');
        setTimeout(() => card.classList.remove('correct-answer'), 1000);
    }
}

function setFeedbackError(element, message) {
    element.classList.remove('hidden');
    element.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
            <i class="fas fa-times-circle mr-2" aria-hidden="true"></i>${message}
        </div>`;
    const card = element.closest('.bg-blue-50, .exercise-card, .bg-white');
    if (card) {
        card.classList.add('wrong-answer');
        setTimeout(() => card.classList.remove('wrong-answer'), 1000);
    }
}

// Confere um conjunto de checkboxes contra um gabarito booleano.
function checkCheckboxSet(ids, expected) {
    return ids.every((id, idx) => {
        const box = document.getElementById(id);
        return box && box.checked === expected[idx];
    });
}

// Normaliza texto de respostas de tradução simbólica (aceita aliases ASCII).
function normalizeLogicText(value) {
    return value.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/<->|↔|⇔|=|≡/g, '↔')
        .replace(/->|→|>/g, '→')
        .replace(/[¬!~]/g, '¬')
        .replace(/[∧&]/g, '∧')
        .replace(/[∨|]/g, '∨');
}

function checkLessonExercise(lessonNumber) {
    const feedbackElement = document.getElementById(`lesson${lessonNumber}-feedback`);
    if (!feedbackElement) return;

    let correct = false;
    let okMessage = '';
    let hintMessage = '';

    switch (lessonNumber) {
        case 1:
            correct = checkCheckboxSet(['lp1', 'lp2', 'lp3', 'lp4'], [true, false, false, true]);
            okMessage = '<strong>Correto!</strong> Apenas "A lua é feita de queijo" e a conjectura de Goldbach são proposições (podem ser V ou F, mesmo que ainda não saibamos qual).';
            hintMessage = '<strong>Incorreto.</strong> Dica: perguntas, ordens e sentenças com variável livre ("x + 3 = 10") não são proposições. Marque somente a 1ª e a 4ª.';
            break;
        case 2: {
            const a = (document.getElementById('l2fill1')?.value || '').trim().toLowerCase();
            const b = (document.getElementById('l2fill2')?.value || '').trim().toLowerCase();
            const c = (document.getElementById('l2fill3')?.value || '').trim().toLowerCase();
            const letters = [a, b, c];
            correct = letters.every(l => /^[pqr]$/.test(l)) && new Set(letters).size === 3;
            okMessage = '<strong>Correto!</strong> Cada proposição recebeu um símbolo distinto — exatamente como fazemos com p, q e r.';
            hintMessage = '<strong>Incorreto.</strong> Use as letras p, q e r, cada uma apenas uma vez (símbolos diferentes para proposições diferentes).';
            break;
        }
        case 3:
            correct = checkCheckboxSet(['l3ex1', 'l3ex2', 'l3ex3', 'l3ex4'], [true, false, true, false]);
            okMessage = '<strong>Correto!</strong> Você identificou corretamente as negações válidas.';
            hintMessage = '<strong>Incorreto.</strong> Lembre-se: a negação apenas inverte o valor lógico ("não é o caso que..."), sem trocar o predicado (médica→engenheira, frio→calor NÃO é negação).';
            break;
        case 4:
            correct = checkCheckboxSet(['l4ex1', 'l4ex2', 'l4ex3', 'l4ex4'], [true, false, true, true]);
            okMessage = '<strong>Correto!</strong> "e", "mas" e "porém" funcionam como conjunções lógicas (∧): exigem as duas partes verdadeiras.';
            hintMessage = '<strong>Incorreto.</strong> Conjunções unem duas proposições com "e" (ou adversativas como "mas", que em lógica valem ∧). "Ou... ou" é disjunção, não conjunção.';
            break;
        case 5:
            correct = checkCheckboxSet(['l5ex1', 'l5ex2', 'l5ex3', 'l5ex4'], [true, false, false, true]);
            okMessage = '<strong>Correto!</strong> As disjunções inclusivas são a 1ª e a 4ª frases.';
            hintMessage = '<strong>Incorreto.</strong> Procure o conectivo "ou" entre duas proposições. "Se...então" é condicional e "e" é conjunção.';
            break;
        case 6: {
            const radio = document.querySelector('input[name="l6ex1"]:checked');
            const translation = normalizeLogicText(document.getElementById('l6ex2')?.value || '');
            correct = Boolean(radio && radio.value === 'c' && (translation === 'p→q' || translation === '¬p∨q'));
            okMessage = '<strong>Correto!</strong> "Se... então..." é a condicional p → q (também aceita: ¬p ∨ q).';
            hintMessage = '<strong>Incorreto.</strong> Na múltipla escolha, marque a frase com "Se..., então...". Na tradução, escreva "p > q" ou "p → q".';
            break;
        }
        case 7:
            correct = checkCheckboxSet(['l7ex1', 'l7ex2', 'l7ex3', 'l7ex4'], [true, true, false, true]);
            okMessage = '<strong>Correto!</strong> p ↔ q significa exatamente (p → q) ∧ (q → p): cada lado implica o outro, e se o time perde você não fica satisfeito.';
            hintMessage = '<strong>Incorreto.</strong> Na bicondicional ambos os lados se implicam. A 3ª afirmativa é falsa: se o time perde (q=F) e você está satisfeito (p=V), p ↔ q seria falsa.';
            break;
        case 8:
            correct = checkCheckboxSet(['l8ex1', 'l8ex2', 'l8ex3', 'l8ex4'], [true, true, false, true]);
            okMessage = '<strong>Correto!</strong> p ∨ ¬p e (p ∧ q) → p são tautologias; p ∧ ¬p é contradição; p → q é apenas uma contingência.';
            hintMessage = '<strong>Incorreto.</strong> Teste mentalmente p=F, q=V em "p → q": a fórmula é V; teste p=V, q=F: é F. Como varia, é contingência — não tautologia.';
            break;
        case 9:
            correct = checkCheckboxSet(['l9ex1', 'l9ex2', 'l9ex3', 'l9ex4', 'l9ex5'], [true, false, true, true, true]);
            okMessage = '<strong>Correto!</strong> Só a 2ª é falsa: ¬p → ¬q é a inversa, que NÃO equivale a p → q. A contrapositiva correta é ¬q → ¬p.';
            hintMessage = '<strong>Incorreto.</strong> Revise: De Morgan troca ∧ por ∨ sob negação; a equivalente de p → q é ¬q → ¬p (contrapositiva), nunca ¬p → ¬q (inversa). A distributiva de ∧ sobre ∨ vale.';
            break;
        case 10:
            correct = checkCheckboxSet(['l10ex1', 'l10ex2', 'l10ex3', 'l10ex4', 'l10ex5'], [true, true, false, true, true]);
            okMessage = '<strong>Correto!</strong> 1 e 2 = Modus Ponens, 4 = Modus Tollens, 5 = Silogismo Hipotético. A 3ª é a falácia da afirmação do consequente.';
            hintMessage = '<strong>Incorreto.</strong> A 3ª forma ("se treino melhoro; melhoro; logo treino") afirma o consequente — falácia. As demais seguem Modus Ponens, Modus Tollens ou silogismo hipotético.';
            break;
        case 11: {
            const answer = normalizeLogicText(document.getElementById('l11ex1')?.value || '');
            correct = answer === 'p∨q' || answer === 'q∨p';
            okMessage = '<strong>Correto!</strong> "OU" em buscas SQL traduz a disjunção: p ∨ q.';
            hintMessage = '<strong>Incorreto.</strong> A consulta usa OR, que corresponde à disjunção. Resposta esperada: "p | q" ou "p ∨ q" (a ordem não importa).';
            break;
        }
        default:
            return;
    }

    if (correct) {
        setFeedbackOK(feedbackElement, okMessage);
        addCompletedLesson(lessonNumber);
    } else {
        setFeedbackError(feedbackElement, hintMessage);
    }
}

/* =========================================================================
   6. EXERCÍCIOS DA SEÇÃO #exercises (1 a 14)
   ========================================================================= */

// Gabaritos centralizados para facilitar manutenção e testes.
const exerciseAnswers = {
    1: { type: 'checkbox', ids: ['ex1-1', 'ex1-2', 'ex1-3', 'ex1-4'], expected: [true, false, true, false], hint: 'Perguntas ("Que horas são?") e pedidos ("Por favor, feche a porta.") não são proposições. Somente declarações avaliáveis: "O céu é azul" e "2 + 2 = 4".' },
    2: { type: 'radio', name: 'ex2', expected: 'V', hint: 'Lembre: p → q só é FALSA quando p é V e q é F. Aqui o antecedente "3 é par" é falso, logo a condicional inteira é verdadeira (verdade vacua).' },
    3: { type: 'table', prefix: 'exercises', expected: ['V', 'F', 'V', 'F', 'F', 'V', 'F', 'V'], hint: 'Primeiro calcule p ∧ q (só V quando ambas são V): coluna 1 = V, F, F, F. Depois inverta para ¬(p ∧ q): coluna 2 = F, V, V, V.' },
    4: { type: 'radio', name: 'ex4', expected: 'a', hint: 'É a segunda Lei de De Morgan aplicada: ¬(p ∨ q) ≡ ¬p ∧ ¬q. "Não é verdade que (p ou q)" significa "nem p nem q".' },
    // --- Novos exercícios (Bloco 2) ---
    5: { type: 'radio', name: 'ex5', expected: 'b', hint: 'Monte a tabela de p → q (V,F,V,V nas linhas VV, VF, FV, FF) e compare com cada alternativa. A única equivalente é ¬p ∨ q — é a chamada implicação material.' },
    6: { type: 'checkbox', ids: ['ex6-1', 'ex6-2', 'ex6-3', 'ex6-4'], expected: [true, true, false, false], hint: 'Tautologia = sempre V. p ∨ ¬p é sempre V; p → p é sempre V. Mas p ∧ ¬p é contradição e p ∨ q é contingência (falsa quando p=F e q=F).' },
    7: { type: 'select', id: 'ex7-class', expected: 'contingencia', hint: 'Faça a tabela de p ∧ q: V apenas na linha (V,V); nas outras três é F. Como tem V e F misturados, é uma CONTINGÊNCIA.' },
    8: { type: 'select', id: 'ex8-class', expected: 'tautologia', hint: 'p → p é verdadeira mesmo quando p é falsa (F→F é V). Todas as linhas dão V: trata-se de uma TAUTOLOGIA.' },
    9: { type: 'text', id: 'ex9-answer', expected: ['!p | q', '¬p ∨ q'], hint: 'A condicional p → q é equivalente a ¬p ∨ q (implicação material). Digite "!p | q" usando os aliases.' },
    10: { type: 'text', id: 'ex10-answer', expected: ['p | q', 'p ∨ q'], hint: '"Ou... ou..." (inclusivo) traduz a disjunção. Resposta esperada: "p | q" (a ordem "q | p" também é aceita).' },
    11: { type: 'table', prefix: 'exercises', expected: ['V', 'F', 'F', 'V'], hint: 'p ↔ q é V somente quando p e q têm o MESMO valor: linhas (V,V) e (F,F) dão V; as linhas mistas (V,F) e (F,V) dão F.' },
    12: { type: 'radio', name: 'ex12', expected: 'c', hint: 'De Morgan com dupla negação: ¬(¬p ∧ ¬q) ≡ ¬¬p ∨ ¬¬q ≡ p ∨ q. Não confunda com ¬p ∨ ¬q nem com p ∧ q.' },
    13: { type: 'radio', name: 'ex13', expected: 'a', hint: 'As premissas são p ∨ q (ao menos um ganhou) e ¬p (Carlos não ganhou). A única possibilidade que resta: Ana ganhou. Este é o silogismo disjuntivo (eliminação).' },
    14: { type: 'checkbox', ids: ['ex14-1', 'ex14-2', 'ex14-3', 'ex14-4'], expected: [true, false, true, false], hint: 'Modus Tollens: de p → q e ¬q conclui-se ¬p. "Se chove então o piso molha; o piso NÃO molha; logo NÃO choveu" é válido. "O piso molha, logo chove" afirma o consequente (falácia).' }
};

function checkExercise(exerciseNumber) {
    const feedbackElement = document.getElementById(`ex${exerciseNumber}-feedback`);
    const answer = exerciseAnswers[exerciseNumber];
    if (!feedbackElement || !answer) return;

    markExerciseAttempted(exerciseNumber);
    let isCorrect = false;

    switch (answer.type) {
        case 'checkbox':
            isCorrect = checkCheckboxSet(answer.ids, answer.expected);
            break;
        case 'radio': {
            const selected = document.querySelector(`input[name="${answer.name}"]:checked`);
            isCorrect = Boolean(selected && selected.value === answer.expected);
            break;
        }
        case 'table': {
            // Exercícios 3 e 11 usam tabelas dentro da aba #exercises; localizamos pela
            // própria tabela (atributo data-exercise) para não misturar as duas.
            const table = document.querySelector(`#exercises table[data-exercise="${exerciseNumber}"]`);
            const inputs = table ? [...table.querySelectorAll('tbody input[type="text"]')] : [];
            isCorrect = inputs.length === answer.expected.length &&
                inputs.every((input, idx) => input.value.trim().toUpperCase() === answer.expected[idx]);
            break;
        }
        case 'select': {
            const select = document.getElementById(answer.id);
            isCorrect = Boolean(select && select.value === answer.expected);
            break;
        }
        case 'text': {
            const field = document.getElementById(answer.id);
            const normalized = normalizeLogicText(field?.value || '');
            isCorrect = normalized !== '' && answer.expected.some(exp => normalizeLogicText(exp) === normalized);
            break;
        }
    }

    if (isCorrect) {
        setFeedbackOK(feedbackElement, '<strong>Correto!</strong> Parabéns, você acertou!');
        markExerciseCorrect(exerciseNumber);
    } else {
        // Feedback com dica contextual obrigatória.
        setFeedbackError(feedbackElement, `<strong>Incorreto.</strong> <em>Dica:</em> ${answer.hint}`);
    }
    renderProgressUI();
    checkAchievements();
}

/* =========================================================================
   7. CONQUISTAS (BADGES REAIS)
   ========================================================================= */

const ACHIEVEMENTS = [
    { id: 'first-lesson', icon: 'fa-book-open', label: 'Primeira lição', description: 'Concluiu a primeira lição', color: 'indigo' },
    { id: 'half-lessons', icon: 'fa-graduation-cap', label: 'Meio caminho', description: 'Concluiu 6 lições', color: 'blue' },
    { id: 'all-lessons', icon: 'fa-scroll', label: 'Mestre das Lições', description: 'Concluiu as 11 lições', color: 'purple' },
    { id: 'five-exercises', icon: 'fa-star', label: '5 Exercícios', description: 'Acertou 5 exercícios', color: 'green' },
    { id: 'ten-exercises', icon: 'fa-certificate', label: 'Veterano', description: 'Acertou 10 exercícios', color: 'teal' },
    { id: 'first-table', icon: 'fa-table', label: 'Cartógrafo da Lógica', description: 'Gerou a primeira tabela-verdade', color: 'yellow' },
    { id: 'fast-challenge', icon: 'fa-bolt', label: 'Rápido no Gatilho', description: 'Acertou um desafio em menos de 30 segundos', color: 'orange' },
    { id: 'streak-3', icon: 'fa-fire', label: 'Sequência de 3', description: 'Três acertos seguidos no modo competitivo', color: 'red' },
    { id: 'top-rank', icon: 'fa-trophy', label: 'Top 1', description: 'Alcançou o 1º lugar do ranking local', color: 'amber' }
];

// Paleta explícita por cor (Tailwind via CDN não detecta classes montadas dinamicamente
// de forma confiável, então as cores usadas aqui também existem em styles.css via fallback;
// mantemos strings completas para o Play CDN gerar em tempo de execução).
const BADGE_COLORS = {
    indigo: { bg: 'bg-indigo-50', circle: 'bg-indigo-100', icon: 'text-indigo-600', text: 'text-indigo-800' },
    blue: { bg: 'bg-blue-50', circle: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-800' },
    purple: { bg: 'bg-purple-50', circle: 'bg-purple-100', icon: 'text-purple-600', text: 'text-purple-800' },
    green: { bg: 'bg-green-50', circle: 'bg-green-100', icon: 'text-green-600', text: 'text-green-800' },
    teal: { bg: 'bg-teal-50', circle: 'bg-teal-100', icon: 'text-teal-600', text: 'text-teal-800' },
    yellow: { bg: 'bg-yellow-50', circle: 'bg-yellow-100', icon: 'text-yellow-600', text: 'text-yellow-800' },
    orange: { bg: 'bg-orange-50', circle: 'bg-orange-100', icon: 'text-orange-600', text: 'text-orange-800' },
    red: { bg: 'bg-red-50', circle: 'bg-red-100', icon: 'text-red-600', text: 'text-red-800' },
    amber: { bg: 'bg-amber-50', circle: 'bg-amber-100', icon: 'text-amber-600', text: 'text-amber-800' }
};

function unlockAchievement(id) {
    if (state.achievements.includes(id)) return;
    state.achievements.push(id);
    saveState();
    renderAchievements();
    showAchievementToast(id);
}

function checkAchievements() {
    if (state.completedLessons.length >= 1) unlockAchievement('first-lesson');
    if (state.completedLessons.length >= 6) unlockAchievement('half-lessons');
    if (state.completedLessons.length >= 11) unlockAchievement('all-lessons');
    if (state.correctExercises.length >= 5) unlockAchievement('five-exercises');
    if (state.correctExercises.length >= 10) unlockAchievement('ten-exercises');
    if (state.bestStreak >= 3) unlockAchievement('streak-3');
    if (getLocalRankPosition() === 1 && state.challengeHistory.some(h => h.correct)) unlockAchievement('top-rank');
}

// Notificação animada (toast) exibida ao desbloquear uma conquista.
let achievementToastTimer = null;
function showAchievementToast(id) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;
    let toast = document.getElementById('achievement-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'achievement-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.className = 'achievement-toast';
    toast.innerHTML = `<i class="fas ${achievement.icon}" aria-hidden="true"></i>
        <span><strong>Conquista desbloqueada!</strong><br>${achievement.label}</span>`;
    // Força reflow para reiniciar a animação em desbloqueios consecutivos.
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(achievementToastTimer);
    achievementToastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function renderAchievements() {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    container.replaceChildren(...ACHIEVEMENTS.map(achievement => {
        const unlocked = state.achievements.includes(achievement.id);
        const colors = BADGE_COLORS[achievement.color];
        const wrapper = document.createElement('div');
        wrapper.className = `badge flex flex-col items-center p-3 rounded-lg ${unlocked ? colors.bg : 'bg-gray-50 opacity-60 grayscale'}`;
        wrapper.title = achievement.description;
        wrapper.innerHTML = `
            <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2 ${unlocked ? colors.circle : 'bg-gray-200'}">
                <i class="fas ${achievement.icon} text-xl ${unlocked ? colors.icon : 'text-gray-400'}" aria-hidden="true"></i>
            </div>
            <span class="text-xs font-medium text-center ${unlocked ? colors.text : 'text-gray-500'}">${achievement.label}</span>
            <span class="sr-only">${unlocked ? 'Desbloqueada' : 'Bloqueada'}: ${achievement.description}</span>`;
        return wrapper;
    }));
}

/* =========================================================================
   8. BARRA DE PROGRESSO DAS LIÇÕES + ESTATÍSTICAS
   ========================================================================= */

function renderProgressUI() {
    const totalLessons = 11;
    const done = state.completedLessons.length;
    const percent = Math.round((done / totalLessons) * 100);

    const fill = document.getElementById('lesson-progress-fill');
    const label = document.getElementById('lesson-progress-label');
    if (fill) fill.style.width = `${percent}%`;
    if (label) label.textContent = `${done}/${totalLessons} lições concluídas (${percent}%)`;

    // Estatísticas da barra lateral do modo competitivo.
    const totalExercises = Object.keys(exerciseAnswers).length;
    const exercisesFill = document.getElementById('stat-exercises-fill');
    const exercisesLabel = document.getElementById('stat-exercises-count');
    if (exercisesFill) exercisesFill.style.width = `${Math.round(state.correctExercises.length / totalExercises * 100)}%`;
    if (exercisesLabel) exercisesLabel.textContent = `${state.correctExercises.length}/${totalExercises}`;

    const lessonsFill = document.getElementById('stat-lessons-fill');
    const lessonsLabel = document.getElementById('stat-lessons-count');
    if (lessonsFill) lessonsFill.style.width = `${percent}%`;
    if (lessonsLabel) lessonsLabel.textContent = `${done}/${totalLessons}`;

    const attempts = state.attemptedExercises.length;
    const accuracy = attempts ? Math.round(state.correctExercises.length / attempts * 100) : 0;
    const accuracyFill = document.getElementById('stat-accuracy-fill');
    const accuracyLabel = document.getElementById('stat-accuracy');
    if (accuracyFill) accuracyFill.style.width = `${accuracy}%`;
    if (accuracyLabel) accuracyLabel.textContent = `${accuracy}%`;

    const scoreLabel = document.getElementById('total-score');
    if (scoreLabel) scoreLabel.textContent = String(state.score);
}

/* =========================================================================
   9. GERADOR DE TABELAS-VERDADE (parser + aliases + erros amigáveis)
   ========================================================================= */

// Aliases aceitos: ! ~ ¬ (negação) | & ∧ (conjunção/disjunção) | > -> → (condicional)
// = <-> ↔ ⇔ (bicondicional) | palavras AND, OR, NOT.
const OPERATOR_SUGGESTIONS = {
    '+': 'use "|" ou "∨" para "ou"',
    '*': 'use "&" ou "∧" para "e"',
    '×': 'use "&" ou "∧" para "e"',
    '^': 'use "->" ou "→" para condicional',
    ';': 'gere uma expressão por vez (sem ";")',
    ',': 'use parênteses ou espaços para separar operandos',
    '0': 'use letras minúsculas (p, q, r...) para variáveis',
    '1': 'use letras minúsculas (p, q, r...) para variáveis'
};

function tokenizeExpression(expression) {
    const suggestions = [];
    expression.split('').forEach(char => {
        if (OPERATOR_SUGGESTIONS[char] && !suggestions.includes(OPERATOR_SUGGESTIONS[char])) {
            suggestions.push(`"${char}" → ${OPERATOR_SUGGESTIONS[char]}`);
        }
    });

    const normalized = expression
        .replace(/<->|↔|⇔/g, ' ↔ ')
        .replace(/->|→/g, ' → ')
        .replace(/\bAND\b/gi, ' ∧ ')
        .replace(/\bOR\b/gi, ' ∨ ')
        .replace(/\bNOT\b/gi, ' ¬ ')
        .replace(/[¬!~]/g, ' ¬ ')
        .replace(/[∧&]/g, ' ∧ ')
        .replace(/[∨|]/g, ' ∨ ')
        .replace(/>/g, ' → ')
        .replace(/=/g, ' ↔ ');

    const tokens = normalized.match(/↔|→|¬|∧|∨|[()]|[a-z]/gi) || [];
    const residue = normalized.replace(/↔|→|¬|∧|∨|[()]|[a-z]/gi, '').replace(/\s/g, '');
    if (!tokens.length) {
        throw new Error('A expressão está vazia ou sem operadores reconhecíveis. Exemplo válido: (p & q) | !r');
    }
    if (residue) {
        let message = `Não reconheci o(s) caractere(s): "${residue}".`;
        if (suggestions.length) message += ` Sugestão: ${suggestions.join('; ')}.`;
        else message += ' Use variáveis de uma letra (p, q, r...) e os operadores ¬(!), ∧(&), ∨(|), →(>), ↔(=).';
        throw new Error(message);
    }
    return tokens.map(token => token.toLowerCase());
}

function parseExpression(tokens) {
    let position = 0;
    // Precedência: ↔ (menor) < → < ∨ < ∧ (maior); ¬ liga mais forte que todos.
    const precedence = { '↔': 1, '→': 2, '∨': 3, '∧': 4 };

    function parsePrimary() {
        const token = tokens[position++];
        if (!token) throw new Error('A expressão terminou inesperadamente — falta um operando depois do último operador?');
        if (token === '¬') return { type: 'not', child: parsePrimary() };
        if (token === '(') {
            const node = parseBinary(0);
            if (tokens[position++] !== ')') throw new Error('Parênteses não balanceados: falta um ")".');
            return node;
        }
        if (/^[a-z]+$/.test(token)) return { type: 'variable', name: token };
        throw new Error(`Símbolo inesperado "${token}". Depois de um operador binário espera-se uma variável, "(" ou "¬".`);
    }

    function parseBinary(minPrecedence) {
        let left = parsePrimary();
        while (position < tokens.length) {
            const operator = tokens[position];
            const level = precedence[operator];
            if (!level || level < minPrecedence) break;
            position++;
            const right = parseBinary(level + 1);
            left = { type: 'binary', operator, left, right };
        }
        return left;
    }

    const ast = parseBinary(0);
    if (position !== tokens.length) throw new Error(`Símbolo inesperado "${tokens[position]}". Confira a sintaxe da expressão.`);
    return ast;
}

function collectVariables(node, found = new Set()) {
    if (node.type === 'variable') found.add(node.name);
    else if (node.type === 'not') collectVariables(node.child, found);
    else { collectVariables(node.left, found); collectVariables(node.right, found); }
    return found;
}

function evaluateExpression(node, values) {
    if (node.type === 'variable') return values[node.name];
    if (node.type === 'not') return !evaluateExpression(node.child, values);
    const left = evaluateExpression(node.left, values);
    const right = evaluateExpression(node.right, values);
    switch (node.operator) {
        case '∧': return left && right;
        case '∨': return left || right;
        case '→': return !left || right;
        case '↔': return left === right;
        default: throw new Error('Operador lógico não reconhecido.');
    }
}

// Classifica a fórmula a partir dos resultados da tabela (apoio às lições 8 e aos exercícios 7/8).
function classifyFormula(results) {
    if (results.every(Boolean)) return 'tautologia';
    if (results.every(result => !result)) return 'contradição';
    return 'contingência';
}

function generateTruthTable() {
    const input = document.getElementById('expression');
    const variablesContainer = document.getElementById('variables');
    const tableContainer = document.getElementById('truth-table-container');
    if (!input || !variablesContainer || !tableContainer) return;

    const expression = input.value.trim();
    if (!expression) {
        tableContainer.innerHTML = '<p class="text-red-600" role="alert">Digite uma expressão lógica para continuar.</p>';
        return;
    }

    try {
        const tokens = tokenizeExpression(expression);
        const ast = parseExpression(tokens);
        const variables = [...collectVariables(ast)].sort();
        if (!variables.length) throw new Error('A expressão precisa de pelo menos uma variável (p, q, r...).');
        if (variables.length > 8) throw new Error('Use no máximo 8 variáveis para manter a tabela legível (2⁸ = 256 linhas).');

        variablesContainer.replaceChildren(...variables.map(variable => {
            const tag = document.createElement('span');
            tag.className = 'bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm';
            tag.textContent = variable;
            return tag;
        }));

        const rows = [];
        const results = [];
        for (let mask = 0; mask < 2 ** variables.length; mask++) {
            const values = Object.fromEntries(variables.map((variable, index) => [variable, Boolean(mask & (1 << (variables.length - index - 1)))]));
            const result = evaluateExpression(ast, values);
            results.push(result);
            rows.push(`<tr>${variables.map(variable => `<td>${values[variable] ? 'V' : 'F'}</td>`).join('')}<td class="font-semibold ${result ? 'text-green-600' : 'text-red-600'}">${result ? 'V' : 'F'}</td></tr>`);
        }

        const safeExpression = expression.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const classification = classifyFormula(results);
        const badgeByClass = {
            tautologia: 'bg-green-100 text-green-800',
            contradição: 'bg-red-100 text-red-800',
            contingência: 'bg-yellow-100 text-yellow-800'
        };
        tableContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 class="font-semibold">Tabela-verdade para: ${safeExpression}</h3>
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full ${badgeByClass[classification]}">Classificação: ${classification}</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="truth-table">
                        <thead><tr>${variables.map(variable => `<th>${variable}</th>`).join('')}<th>${safeExpression}</th></tr></thead>
                        <tbody>${rows.join('')}</tbody>
                    </table>
                </div>
            </div>`;

        unlockAchievement('first-table');
    } catch (error) {
        variablesContainer.replaceChildren();
        tableContainer.innerHTML = `
            <div class="bg-red-50 border border-red-300 rounded-lg p-4" role="alert">
                <p class="text-red-700 font-medium mb-1"><i class="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>${error.message}</p>
                <p class="text-sm text-gray-600">Exemplo válido: <code class="bg-gray-100 px-1 rounded">(p &amp; q) | !r</code> — aliases aceitos: <strong>!</strong> (¬), <strong>&amp;</strong> (∧), <strong>|</strong> (∨), <strong>&gt;</strong> ou <strong>-&gt;</strong> (→), <strong>=</strong> ou <strong>&lt;-&gt;</strong> (↔).</p>
            </div>`;
    }
}

// Carrega um exemplo pronto no campo e gera a tabela imediatamente.
function loadExample(expression) {
    const field = document.getElementById('expression');
    if (field) field.value = expression;
    generateTruthTable();
}

/* =========================================================================
   10. MODO COMPETITIVO GAMIFICADO
   ========================================================================= */

// Cinco desafios rotacionados; a rotação é controlada por localStorage.
const CHALLENGES = [
    {
        id: 'negacao-condicional',
        title: 'Negação de Condicional',
        prompt: 'Qual é a negação da proposição "Se chover, então eu levo o guarda-chuva"?',
        options: [
            'Se não chover, então eu não levo o guarda-chuva',
            'Chove e eu não levo o guarda-chuva',
            'Não chove ou eu levo o guarda-chuva',
            'Eu levo o guarda-chuva e não chove'
        ],
        answer: 'b',
        explanation: 'A negação de "p → q" é "p ∧ ¬q": chove e mesmo assim eu não levo o guarda-chuva.'
    },
    {
        id: 'morgan',
        title: 'Leis de De Morgan',
        prompt: 'Equivalentemente a ¬(p ∧ q), temos:',
        options: ['¬p ∧ ¬q', '¬p ∨ ¬q', 'p ∨ q', '¬p → ¬q'],
        answer: 'b',
        explanation: 'Pela primeira Lei de De Morgan, ¬(p ∧ q) ≡ ¬p ∨ ¬q: a negação "vira" o conectivo.'
    },
    {
        id: 'tautologia',
        title: 'Identificar Tautologia',
        prompt: 'Qual das fórmulas abaixo é uma tautologia?',
        options: ['p ∧ ¬p', 'p → q', 'p ∨ ¬p', 'p ↔ q'],
        answer: 'c',
        explanation: 'p ∨ ¬p é sempre verdadeira, qualquer que seja p — a clássica tautologia do terceiro excluído.'
    },
    {
        id: 'modus-tollens',
        title: 'Regra de Inferência',
        prompt: 'Das premissas "Se estudo, então passo" e "Não passei", conclui-se validamente que:',
        options: ['Estudei', 'Não estudei', 'Possivelmente estudei', 'Nada se pode concluir'],
        answer: 'b',
        explanation: 'É o Modus Tollens: de p → q e ¬q, conclui-se ¬p. Se tivesse estudado, teria passado.'
    },
    {
        id: 'bicondicional',
        title: 'Valor da Bicondicional',
        prompt: 'Se p é verdadeiro e q é falso, qual o valor de p ↔ q?',
        options: ['Verdadeiro', 'Falso', 'Indeterminado', 'Depende de r'],
        answer: 'b',
        explanation: 'A bicondicional exige valores iguais: com p=V e q=F, p ↔ q é falsa.'
    }
];

const CHALLENGE_DURATION = 90; // segundos por desafio

let challengeTimeLeft = CHALLENGE_DURATION;
let challengeTimerId = null;
let challengeSubmitted = false;
let challengeStartTime = null;
let currentChallenge = null;

// Índices dos desafios já respondidos nesta "volta"; devolve o próximo índice (rotação via localStorage).
function getNextChallengeIndex() {
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem('dologic:challengeSeen') || '[]'); } catch (error) { seen = []; }
    if (!Array.isArray(seen) || seen.length >= CHALLENGES.length) seen = [];
    let index = Math.floor(Math.random() * CHALLENGES.length);
    while (seen.includes(index)) index = (index + 1) % CHALLENGES.length;
    seen.push(index);
    try { localStorage.setItem('dologic:challengeSeen', JSON.stringify(seen)); } catch (error) { /* opcional */ }
    return index;
}

function loadChallenge() {
    const index = getNextChallengeIndex();
    currentChallenge = CHALLENGES[index];

    const title = document.getElementById('challenge-title');
    const prompt = document.getElementById('challenge-prompt');
    const optionsBox = document.getElementById('challenge-options');
    if (title) title.textContent = `Desafio: ${currentChallenge.title}`;
    if (prompt) prompt.textContent = currentChallenge.prompt;
    if (optionsBox) {
        optionsBox.innerHTML = currentChallenge.options.map((option, i) => {
            const value = String.fromCharCode(97 + i); // a, b, c, d
            return `
                <div class="flex items-start">
                    <input type="radio" id="challenge-${i + 1}" name="challenge" value="${value}" class="mr-2 mt-1">
                    <label for="challenge-${i + 1}" class="cursor-pointer">${option}</label>
                </div>`;
        }).join('');
    }

    // Restaura o estado do cartão de desafio.
    challengeSubmitted = false;
    challengeStartTime = Date.now();
    challengeTimeLeft = CHALLENGE_DURATION;
    const existingResult = document.getElementById('challenge-result');
    if (existingResult) existingResult.remove();
    const warning = document.getElementById('challenge-warning');
    if (warning) warning.remove();
    const submitButton = document.getElementById('challenge-submit');
    if (submitButton) submitButton.disabled = false;

    updateTimerDisplay();
    startChallengeTimer();
    renderStreak();
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    const minutes = Math.floor(challengeTimeLeft / 60);
    const seconds = challengeTimeLeft % 60;
    timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startChallengeTimer() {
    if (!document.getElementById('timer')) return;
    if (challengeTimerId || challengeSubmitted || challengeTimeLeft <= 0) return;
    challengeTimerId = window.setInterval(() => {
        challengeTimeLeft = Math.max(0, challengeTimeLeft - 1);
        updateTimerDisplay();
        if (challengeTimeLeft === 0) {
            clearInterval(challengeTimerId);
            challengeTimerId = null;
            finishChallenge(false, true);
        }
    }, 1000);
}

// Pontuação: +50 acerto, -10 erro, bônus de velocidade (<30s: +30; <60s: +15) e multiplicador de streak.
function computeChallengePoints(isCorrect, elapsedSeconds, streakBefore) {
    if (!isCorrect) return -10;
    const speedBonus = elapsedSeconds < 30 ? 30 : elapsedSeconds < 60 ? 15 : 0;
    const multiplier = 1 + Math.min(streakBefore, 5) * 0.2; // até x2.0 após 5 acertos seguidos
    return Math.round((50 + speedBonus) * multiplier);
}

function getCurrentStreak() {
    let streak = 0;
    for (let i = state.challengeHistory.length - 1; i >= 0; i--) {
        if (state.challengeHistory[i].correct) streak++;
        else break;
    }
    return streak;
}

function renderStreak() {
    const streakNow = getCurrentStreak();
    const label = document.getElementById('streak-display');
    if (label) label.textContent = `${streakNow} (multiplicador x${(1 + Math.min(streakNow, 5) * 0.2).toFixed(1)})`;
}

// Posição do jogador no ranking local (pontuações fictícias fixas + pontuação real).
const RIVAL_SCORES = [
    { name: 'Ana Silva', points: 1250, challenges: 28 },
    { name: 'Carlos Oliveira', points: 1120, challenges: 25 },
    { name: 'Maria Santos', points: 850, challenges: 18 },
    { name: 'João Pereira', points: 720, challenges: 15 }
];

function getRankedBoard() {
    const board = [...RIVAL_SCORES, { name: 'Você', points: state.score, challenges: state.challengeHistory.length }];
    board.sort((a, b) => b.points - a.points);
    return board;
}

function getLocalRankPosition() {
    return getRankedBoard().findIndex(entry => entry.name === 'Você') + 1;
}

function renderRanking() {
    const tbody = document.getElementById('ranking-body');
    if (!tbody) return;
    const medals = ['bg-yellow-100 text-yellow-800', 'bg-gray-200 text-gray-800', 'bg-amber-100 text-amber-800'];
    tbody.innerHTML = getRankedBoard().map((entry, index) => `
        <tr class="${entry.name === 'Você' ? 'bg-indigo-50' : ''}">
            <td class="px-6 py-4 whitespace-nowrap"><span class="text-xs font-semibold px-2 py-1 rounded ${medals[index] || 'text-gray-600'}">${index + 1}º</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${entry.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.points.toLocaleString('pt-BR')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${entry.challenges}</td>
        </tr>`).join('');
}

function renderChallengeHistory() {
    const container = document.getElementById('challenge-history');
    if (!container) return;
    if (!state.challengeHistory.length) {
        container.innerHTML = '<p class="text-sm text-gray-500">Você ainda não participou de nenhum desafio. Responda o desafio acima para aparecer aqui!</p>';
        return;
    }
    const recent = [...state.challengeHistory].reverse().slice(0, 8);
    container.innerHTML = recent.map(record => {
        const date = new Date(record.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div class="flex items-center min-w-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${record.correct ? 'bg-green-100' : 'bg-red-100'}">
                        <i class="fas ${record.correct ? 'fa-check text-green-600' : 'fa-times text-red-600'} text-sm" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                        <span class="text-sm block truncate">${record.title}</span>
                        <span class="text-xs text-gray-500">${date} · ${record.elapsed}s${record.streak > 1 ? ` · sequência ${record.streak}` : ''}</span>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded shrink-0 ${record.points >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${record.points >= 0 ? '+' : ''}${record.points} pts</span>
            </div>`;
    }).join('');
}

function finishChallenge(isCorrect, timedOut = false) {
    if (challengeSubmitted || !currentChallenge) return;
    challengeSubmitted = true;
    if (challengeTimerId) { clearInterval(challengeTimerId); challengeTimerId = null; }

    const elapsed = Math.min(CHALLENGE_DURATION, Math.round((Date.now() - (challengeStartTime || Date.now())) / 1000));
    const streakBefore = getCurrentStreak();
    const points = timedOut ? -10 : computeChallengePoints(isCorrect, elapsed, streakBefore);
    const newStreak = isCorrect && !timedOut ? streakBefore + 1 : 0;

    document.querySelectorAll('input[name="challenge"]').forEach(input => { input.disabled = true; });
    const submitButton = document.getElementById('challenge-submit');
    if (submitButton) submitButton.disabled = true;

    // Atualiza estado persistente.
    state.score = Math.max(0, state.score + points);
    state.bestStreak = Math.max(state.bestStreak, newStreak);
    state.challengeHistory.push({
        title: currentChallenge.title,
        correct: Boolean(isCorrect) && !timedOut,
        points,
        elapsed,
        streak: newStreak,
        date: Date.now()
    });
    saveState();

    // Tela final com resumo do desafio (tempo, acertos, pontos, posição no ranking).
    const card = document.getElementById('challenge-card');
    if (card) {
        const resultBox = document.createElement('div');
        resultBox.id = 'challenge-result';
        resultBox.setAttribute('role', 'status');
        resultBox.setAttribute('aria-live', 'polite');
        resultBox.className = isCorrect && !timedOut
            ? 'mt-4 px-4 py-3 rounded border bg-green-100 border-green-400 text-green-800'
            : 'mt-4 px-4 py-3 rounded border bg-red-100 border-red-400 text-red-800';
        const headline = timedOut
            ? '<strong>Tempo esgotado!</strong> O desafio terminou antes do envio da resposta.'
            : isCorrect
                ? '<strong>Correto!</strong> Muito bem!'
                : '<strong>Incorreto.</strong>';
        resultBox.innerHTML = `
            ${headline}
            <p class="text-sm mt-1"><i class="fas fa-lightbulb mr-1" aria-hidden="true"></i>${currentChallenge.explanation}</p>
            <ul class="text-sm mt-3 grid grid-cols-2 gap-2 list-none p-0">
                <li><i class="fas fa-stopwatch mr-1" aria-hidden="true"></i>Tempo: <strong>${elapsed}s</strong></li>
                <li><i class="fas fa-${isCorrect && !timedOut ? 'check' : 'times'} mr-1" aria-hidden="true"></i>Resultado: <strong>${isCorrect && !timedOut ? 'Acerto' : 'Erro'}</strong></li>
                <li><i class="fas fa-star mr-1" aria-hidden="true"></i>Pontos: <strong>${points >= 0 ? '+' : ''}${points}</strong></li>
                <li><i class="fas fa-fire mr-1" aria-hidden="true"></i>Sequência atual: <strong>${newStreak}</strong></li>
                <li class="col-span-2"><i class="fas fa-ranking-star mr-1" aria-hidden="true"></i>Nova posição no ranking local: <strong>${getLocalRankPosition()}º</strong> · Total: <strong>${state.score} pts</strong></li>
            </ul>
            <button onclick="loadChallenge()" class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                <i class="fas fa-rotate-right mr-2" aria-hidden="true"></i>Próximo desafio
            </button>`;
        card.appendChild(resultBox);
    }

    // Conquistas relacionadas ao desafio.
    if (isCorrect && !timedOut && elapsed < 30) unlockAchievement('fast-challenge');
    checkAchievements();
    renderRanking();
    renderChallengeHistory();
    renderProgressUI();
    renderStreak();
}

function submitChallenge() {
    if (challengeSubmitted || !currentChallenge) return;
    const selectedOption = document.querySelector('input[name="challenge"]:checked');
    if (!selectedOption) {
        const card = document.getElementById('challenge-card');
        let warning = document.getElementById('challenge-warning');
        if (!warning && card) {
            warning = document.createElement('p');
            warning.id = 'challenge-warning';
            warning.className = 'mt-3 text-sm text-amber-700';
            warning.setAttribute('role', 'alert');
            warning.textContent = 'Selecione uma alternativa antes de enviar.';
            card.appendChild(warning);
        }
        return;
    }
    finishChallenge(selectedOption.value === currentChallenge.answer);
}

/* =========================================================================
   INICIALIZAÇÃO
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Liga os botões de aba via data-tab + teclado (padrão WAI-ARIA tabs).
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.setAttribute('role', 'tab');
        button.addEventListener('click', () => showTab(button.getAttribute('data-tab')));
        button.addEventListener('keydown', handleTabKeydown);
    });
    document.querySelectorAll('.tab-content').forEach(panel => panel.setAttribute('role', 'tabpanel'));

    // Restaura a última aba visitada.
    let savedTab = 'home';
    try { savedTab = localStorage.getItem('currentTab') || 'home'; } catch (error) { /* opcional */ }
    showTab(document.getElementById(savedTab) ? savedTab : 'home');

    // Aplica o modo escuro salvo.
    applyDarkMode();

    // Renderiza conquistas, progresso, ranking e histórico persistidos.
    renderAchievements();
    renderProgressUI();
    renderRanking();
    renderChallengeHistory();
    renderStreak();

    // Monta o primeiro desafio (o cronômetro roda a partir da abertura da aba).
    loadChallenge();

    // Enter gera a tabela-verdade.
    const expressionField = document.getElementById('expression');
    if (expressionField) {
        expressionField.addEventListener('keydown', event => {
            if (event.key === 'Enter') { event.preventDefault(); generateTruthTable(); }
        });
    }
});
