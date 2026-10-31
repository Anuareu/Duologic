// Navegação entre as seções da aplicação.
function showTab(tabId) {
    const target = document.getElementById(tabId);
    if (!target || !target.classList.contains('tab-content')) return;

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab === target);
    });

    document.querySelectorAll('.tab-btn').forEach(button => {
        const isActive = button.getAttribute('onclick')?.includes(`'${tabId}'`);
        button.classList.toggle('bg-indigo-800', Boolean(isActive));
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    try { localStorage.setItem('currentTab', tabId); } catch (error) { /* armazenamento opcional */ }
    if (tabId === 'competitive') startChallengeTimer();
}

document.addEventListener('DOMContentLoaded', () => {
    let savedTab = 'home';
    try { savedTab = localStorage.getItem('currentTab') || 'home'; } catch (error) { /* armazenamento opcional */ }
    showTab(document.getElementById(savedTab) ? savedTab : 'home');
});

// Lesson navigation
        function showLesson(lessonNumber) {
            const lessonContent = document.getElementById('lesson-content');
            const lessons = {
                1: {
                    title: "Introdução à Lógica",
                    content: `
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Introdução à Lógica</h2>
                        <p class="text-gray-600 mb-4">A lógica proposicional, também conhecida como lógica de ordem zero, é o ramo mais básico da lógica matemática. Ela lógica com proposições que podem ser verdadeiras ou falsas, e como essas proposições podem ser combinadas ou modificadas por meio de conectivos lógicos.</p>
                        
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <h3 class="font-semibold text-gray-800 mb-2">O que é uma proposição?</h3>
                            <p class="text-gray-600">Uma <span class="glossary-term">proposição<span class="glossary-tooltip">Declaração que pode ser claramente classificada como verdadeira ou falsa</span></span> é uma sentença declarativa que pode ser classificada como verdadeira (V) ou falsa (F), mas não ambas.</p>
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
                            <div class="space-y-2">
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
                            </div>
                            <button onclick="checkLessonExercise(1)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                            <div id="lesson1-feedback" class="mt-2 text-sm hidden"></div>
                        </div>
                    `
                },
                2: {
                    title: "Proposições Simples",
                    content: `
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Proposições Simples</h2>
                        <p class="text-gray-600 mb-4">Proposições simples (ou atômicas) são aquelas que não podem ser divididas em partes menores que ainda sejam proposições. Elas representam as unidades básicas da lógica proposicional.</p>
                        
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
                            <p class="text-blue-700 mb-3">Atribua símbolos às seguintes proposições simples:</p>
                            <div class="space-y-3">
                                <div>
                                    <p class="text-gray-700 mb-1">"O gato está dormindo."</p>
                                    <input type="text" class="border rounded p-2 w-16 text-center" placeholder="p, q, r...">
                                </div>
                                <div>
                                    <p class="text-gray-700 mb-1">"A aula começou."</p>
                                    <input type="text" class="border rounded p-2 w-16 text-center" placeholder="p, q, r...">
                                </div>
                                <div>
                                    <p class="text-gray-700 mb-1">"O Brasil é um país tropical."</p>
                                    <input type="text" class="border rounded p-2 w-16 text-center" placeholder="p, q, r...">
                                </div>
                            </div>
                            <button onclick="checkLessonExercise(2)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                            <div id="lesson2-feedback" class="mt-2 text-sm hidden"></div>
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
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <input type="checkbox" id="l3ex1" class="mr-2">
                                    <label for="l3ex1" class="cursor-pointer">Proposição: "O sol nasceu." | Negação: "O sol não nasceu."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l3ex2" class="mr-2">
                                    <label for="l3ex2" class="cursor-pointer">Proposição: "Maria é médica." | Negação: "Maria é engenheira."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l3ex3" class="mr-2">
                                    <label for="l3ex3" class="cursor-pointer">Proposição: "2 + 2 = 5" | Negação: "2 + 2 ≠ 5"</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l3ex4" class="mr-2">
                                    <label for="l3ex4" class="cursor-pointer">Proposição: "Está frio." | Negação: "Está calor."</label>
                                </div>
                            </div>
                            <button onclick="checkLessonExercise(3)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                            <div id="lesson3-feedback" class="mt-2 text-sm hidden"></div>
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
                            <p class="text-blue-700 mb-3">Qual das seguintes frases é uma conjunção lógica válida?</p>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <input type="checkbox" id="l4ex1" class="mr-2">
                                    <label for="l4ex1" class="cursor-pointer">"O cachorro latiu e o gato miou."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l4ex2" class="mr-2">
                                    <label for="l4ex2" class="cursor-pointer">"Ou você estuda, ou você trabalha."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l4ex3" class="mr-2">
                                    <label for="l4ex3" class="cursor-pointer">"Pedro correu e Maria chegou."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l4ex4" class="mr-2">
                                    <label for="l4ex4" class="cursor-pointer">"Está calor, mas pode chover."</label>
                                </div>
                            </div>
                            <button onclick="checkLessonExercise(4)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                            <div id="lesson4-feedback" class="mt-2 text-sm hidden"></div>
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
                            <p class="text-gray-600">Na lógica proposicional, a disjunção é inclusiva, ou seja, considera-se verdadeira se uma ou ambas as proposições forem verdadeiras.</p>
                        </div>

                        <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-800 mb-2">Exercício Prático</h3>
                            <p class="text-blue-700 mb-3">Qual das frases abaixo representa uma disjunção lógica?</p>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <input type="checkbox" id="l5ex1" class="mr-2">
                                    <label for="l5ex1" class="cursor-pointer">"O aluno passou ou ele estudou muito."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l5ex2" class="mr-2">
                                    <label for="l5ex2" class="cursor-pointer">"Se chover, não sairei."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l5ex3" class="mr-2">
                                    <label for="l5ex3" class="cursor-pointer">"Ana viajou e levou o cachorro."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" id="l5ex4" class="mr-2">
                                    <label for="l5ex4" class="cursor-pointer">"Posso tomar café ou chá."</label>
                                </div>
                            </div>
                            <button onclick="checkLessonExercise(5)" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                            <div id="lesson5-feedback" class="mt-2 text-sm hidden"></div>
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
                            <p class="text-gray-600">A condicional não afirma que <em>p</em> ou <em>q</em> são verdadeiros isoladamente, mas sim que, se <em>p</em> for verdadeira, então <em>q</em> deve ser também.</p>
                        </div>

                        <div class="mt-6 bg-blue-50 p-4 rounded-lg mb-6">
                            <h3 class="font-semibold text-blue-800 mb-2">Exercício 1 – Múltipla escolha</h3>
                            <p class="text-blue-700 mb-3">Qual frase representa corretamente uma condicional?</p>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <input type="radio" id="l6ex1a" name="l6ex1" value="a" class="mr-2">
                                    <label for="l6ex1a" class="cursor-pointer">"Estudo lógica e passo na prova."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="radio" id="l6ex1b" name="l6ex1" value="b" class="mr-2">
                                    <label for="l6ex1b" class="cursor-pointer">"Estudo lógica ou passo na prova."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="radio" id="l6ex1c" name="l6ex1" value="c" class="mr-2">
                                    <label for="l6ex1c" class="cursor-pointer">"Se estudo lógica, então passo na prova."</label>
                                </div>
                                <div class="flex items-center">
                                    <input type="radio" id="l6ex1d" name="l6ex1" value="d" class="mr-2">
                                    <label for="l6ex1d" class="cursor-pointer">"Não estudo lógica."</label>
                                </div>
                            </div>
                        </div>

                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-800 mb-2">Exercício 2 – Preenchimento</h3>
                            <p class="text-blue-700 mb-3">Complete a proposição condicional com as partes corretas:</p>
                            <p class="text-gray-700 mb-2"><strong>Se</strong> <input type="text" id="l6fill1" class="border rounded p-1 w-48 text-center mx-1" placeholder="..." />, <strong>então</strong> <input type="text" id="l6fill2" class="border rounded p-1 w-48 text-center mx-1" placeholder="..." />.</p>
                            <p class="text-sm text-gray-500 italic">Dica: use "você estudar" e "você aprenderá lógica".</p>
                        </div>

                        <button onclick="checkLessonExercise(6)" class="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Verificar</button>
                        <div id="lesson6-feedback" class="mt-2 text-sm hidden"></div>
                    `
                },
                7: {
                    title: "Bicondicional (↔)",
                    content: "Conteúdo da lição sobre Bicondicional..."
                },
                8: {
                    title: "Tautologias e Contradições",
                    content: "Conteúdo da lição sobre Tautologias e Contradições..."
                },
                9: {
                    title: "Equivalências Lógicas",
                    content: "Conteúdo da lição sobre Equivalências Lógicas..."
                },
                10: {
                    title: "Argumentos Válidos",
                    content: "Conteúdo da lição sobre Argumentos Válidos..."
                },
                11: {
                    title: "Aplicações Práticas",
                    content: "Conteúdo da lição sobre Aplicações Práticas..."
                }
            };
            
            const selectedLesson = lessons[lessonNumber];
            if (!selectedLesson) return;
            lessonContent.innerHTML = selectedLesson.content;
            document.querySelectorAll('#lessons button[onclick^="showLesson"]').forEach(button => {
                const active = button.getAttribute('onclick') === `showLesson(${lessonNumber})`;
                button.classList.toggle('bg-indigo-100', active);
                button.classList.toggle('font-semibold', active);
            });
        }
        
        // Exercise checking
        function checkExercise(exerciseNumber) {
            const feedbackElement = document.getElementById(`ex${exerciseNumber}-feedback`);
            
            // This is a simplified version - in a real app, you would check the actual answers
            const correctAnswers = {
                1: [true, false, true, false], // Checkboxes for exercise 1
                2: "V", // Radio button for exercise 2
                3: [ // Table values for exercise 3
                    ["V", "F"],
                    ["F", "V"],
                    ["F", "V"],
                    ["F", "V"]
                ],
                4: "a" // Radio button for exercise 4
            };
            
            let isCorrect = false;
            
            switch(exerciseNumber) {
                case 1:
                    const checkboxes = [
                        document.getElementById('ex1-1').checked,
                        document.getElementById('ex1-2').checked,
                        document.getElementById('ex1-3').checked,
                        document.getElementById('ex1-4').checked
                    ];
                    isCorrect = checkboxes.every((val, idx) => val === correctAnswers[1][idx]);
                    break;
                case 2:
                    const selectedRadio = document.querySelector('input[name="ex2"]:checked');
                    isCorrect = selectedRadio && selectedRadio.value === correctAnswers[2];
                    break;
                case 3:
                    const tableInputs = [...document.querySelectorAll('#exercises .truth-table tbody input')];
                    const expected = correctAnswers[3].flat();
                    isCorrect = tableInputs.length === expected.length &&
                        tableInputs.every((input, index) => input.value.trim().toUpperCase() === expected[index]);
                    break;
                case 4:
                    const selectedRadio4 = document.querySelector('input[name="ex4"]:checked');
                    isCorrect = selectedRadio4 && selectedRadio4.value === correctAnswers[4];
                    break;
            }
            
            feedbackElement.classList.remove('hidden');
            
            if (isCorrect) {
                feedbackElement.innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <i class="fas fa-check-circle mr-2"></i>
                        <strong>Correto!</strong> Parabéns, você acertou!
                    </div>
                `;
                feedbackElement.parentElement.classList.add('correct-answer');
                setTimeout(() => {
                    feedbackElement.parentElement.classList.remove('correct-answer');
                }, 1000);
                
                // In a real app, you would update progress and achievements here
            } else {
                feedbackElement.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <i class="fas fa-times-circle mr-2"></i>
                        <strong>Incorreto.</strong> Tente novamente ou revise a lição relacionada.
                    </div>
                `;
                feedbackElement.parentElement.classList.add('wrong-answer');
                setTimeout(() => {
                    feedbackElement.parentElement.classList.remove('wrong-answer');
                }, 1000);
            }
        }
        
        // Lesson exercise checking
        function checkLessonExercise(lessonNumber) {
            const feedbackElement = document.getElementById(`lesson${lessonNumber}-feedback`);
            feedbackElement.classList.remove('hidden');
            
            // Simplified checking for demo
            if (lessonNumber === 1) {
                const checkboxes = [
                    document.getElementById('lp1').checked,
                    document.getElementById('lp2').checked,
                    document.getElementById('lp3').checked,
                    document.getElementById('lp4').checked
                ];
                
                const correct = [true, false, false, true];
                
                if (checkboxes.every((val, idx) => val === correct[idx])) {
                    feedbackElement.innerHTML = `
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <i class="fas fa-check-circle mr-2"></i>
                            <strong>Correto!</strong> Apenas as sentenças 1 e 4 são proposições.
                        </div>
                    `;
                } else {
                    feedbackElement.innerHTML = `
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <i class="fas fa-times-circle mr-2"></i>
                            <strong>Incorreto.</strong> Lembre-se: proposições são declarações que podem ser verdadeiras ou falsas, mas não perguntas, ordens ou sentenças vagas.
                        </div>
                    `;
                }
            } else if (lessonNumber === 2) {
                // Simplified for demo
                feedbackElement.innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <i class="fas fa-check-circle mr-2"></i>
                        <strong>Exemplo de resposta:</strong> Você poderia usar p, q e r respectivamente para as três proposições.
                    </div>
                `;
            }
                    else if (lessonNumber === 3) {
            const checks = [
                document.getElementById('l3ex1').checked,
                document.getElementById('l3ex2').checked,
                document.getElementById('l3ex3').checked,
                document.getElementById('l3ex4').checked
            ];
            const correct = [true, false, true, false];

            if (checks.every((val, idx) => val === correct[idx])) {
                feedbackElement.innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <i class="fas fa-check-circle mr-2"></i>
                        <strong>Correto!</strong> Você identificou corretamente as negações válidas.
                    </div>
                `;
            } else {
                feedbackElement.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <i class="fas fa-times-circle mr-2"></i>
                        <strong>Incorreto.</strong> Lembre-se: a negação deve apenas inverter o valor lógico, e não mudar completamente o significado da proposição.
                    </div>
                `;
            }
        }
                    else if (lessonNumber === 4) {
                const checks = [
                    document.getElementById('l4ex1').checked,
                    document.getElementById('l4ex2').checked,
                    document.getElementById('l4ex3').checked,
                    document.getElementById('l4ex4').checked
                ];
                const correct = [true, false, true, false];

                if (checks.every((val, idx) => val === correct[idx])) {
                    feedbackElement.innerHTML = `
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <i class="fas fa-check-circle mr-2"></i>
                            <strong>Correto!</strong> Você reconheceu corretamente as conjunções lógicas.
                        </div>
                    `;
                } else {
                    feedbackElement.innerHTML = `
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <i class="fas fa-times-circle mr-2"></i>
                            <strong>Incorreto.</strong> Lembre-se: conjunções usam o conectivo "e" (∧) e ligam duas proposições completas.
                        </div>
                    `;
                }
            }
            else if (lessonNumber === 5) {
            const checks = [
                document.getElementById('l5ex1').checked,
                document.getElementById('l5ex2').checked,
                document.getElementById('l5ex3').checked,
                document.getElementById('l5ex4').checked
            ];
            const correct = [false, false, true, false];

            if (checks.every((val, idx) => val === correct[idx])) {
                feedbackElement.innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <i class="fas fa-check-circle mr-2"></i>
                        <strong>Correto!</strong> Você identificou corretamente as disjunções lógicas.
                    </div>
                `;
            } else {
                feedbackElement.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <i class="fas fa-times-circle mr-2"></i>
                        <strong>Incorreto.</strong> Disjunções usam o conectivo "ou" (∨) para unir proposições e são verdadeiras se pelo menos uma for verdadeira.
                    </div>
                `;
            }
}

        }
        
// Geração de tabelas-verdade com análise sintática e avaliação das expressões.
function tokenizeExpression(expression) {
    const normalized = expression
        .replace(/<->|↔|⇔/g, ' ↔ ')
        .replace(/->|→/g, ' → ')
        .replace(/\bAND\b/gi, ' ∧ ')
        .replace(/\bOR\b/gi, ' ∨ ')
        .replace(/\bNOT\b/gi, ' ¬ ')
        .replace(/[¬!~]/g, ' ¬ ')
        .replace(/[∧&]/g, ' ∧ ')
        .replace(/[∨|]/g, ' ∨ ');
    const tokens = normalized.match(/↔|→|¬|∧|∨|[()]|[a-z]/gi) || [];
    const residue = normalized.replace(/↔|→|¬|∧|∨|[()]|[a-z]/gi, '').replace(/\s/g, '');
    if (residue || !tokens.length) {
        throw new Error('A expressão contém símbolos não reconhecidos.');
    }
    return tokens.map(token => token.toLowerCase());
}
function parseExpression(tokens) {
    let position = 0;
    const precedence = { '↔': 1, '→': 2, '∨': 3, '∧': 4 };

    function parsePrimary() {
        const token = tokens[position++];
        if (!token) throw new Error('A expressão está incompleta.');
        if (token === '¬') return { type: 'not', child: parsePrimary() };
        if (token === '(') {
            const node = parseBinary(0);
            if (tokens[position++] !== ')') throw new Error('Verifique os parênteses.');
            return node;
        }
        if (/^[a-z]+$/i.test(token)) return { type: 'variable', name: token };
        throw new Error(`Símbolo inesperado: ${token}`);
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
    if (position !== tokens.length) throw new Error(`Símbolo inesperado: ${tokens[position]}`);
    return ast;
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

function generateTruthTable() {
    const input = document.getElementById('expression');
    const variablesContainer = document.getElementById('variables');
    const tableContainer = document.getElementById('truth-table-container');
    const expression = input.value.trim();
    if (!expression) {
        tableContainer.innerHTML = '<p class="text-red-600">Digite uma expressão lógica para continuar.</p>';
        return;
    }

    try {
        const tokens = tokenizeExpression(expression);
        const ast = parseExpression(tokens);
        const variables = [...new Set(tokens.filter(token => /^[a-z]+$/i.test(token)))].sort();
        if (variables.length > 8) throw new Error('Use no máximo 8 variáveis para manter a tabela legível.');
        variablesContainer.replaceChildren(...variables.map(variable => {
            const tag = document.createElement('span');
            tag.className = 'bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm';
            tag.textContent = variable;
            return tag;
        }));

        const rows = [];
        for (let mask = 0; mask < 2 ** variables.length; mask++) {
            const values = Object.fromEntries(variables.map((variable, index) => [variable, Boolean(mask & (1 << (variables.length - index - 1)))]));
            const result = evaluateExpression(ast, values);
            rows.push(`<tr>${variables.map(variable => `<td>${values[variable] ? 'V' : 'F'}</td>`).join('')}<td class="font-semibold ${result ? 'text-green-600' : 'text-red-600'}">${result ? 'V' : 'F'}</td></tr>`);
        }
        const safeExpression = expression.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        tableContainer.innerHTML = `<div class="bg-white p-4 rounded-lg shadow"><h3 class="font-semibold mb-3">Tabela-verdade para: ${safeExpression}</h3><div class="overflow-x-auto"><table class="truth-table"><thead><tr>${variables.map(variable => `<th>${variable}</th>`).join('')}<th>${safeExpression}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
    } catch (error) {
        variablesContainer.replaceChildren();
        tableContainer.innerHTML = `<p class="text-red-600" role="alert">${error.message}</p><p class="text-sm text-gray-500 mt-2">Exemplo válido: (p ∧ q) ∨ ¬r</p>`;
    }
}

        // Load example expression
        function loadExample(expression) {
            document.getElementById('expression').value = expression;
            generateTruthTable();
        }
        
// Desafio competitivo: o cronômetro só começa ao abrir a seção.
let challengeTimeLeft = 90;
let challengeTimerId = null;
let challengeSubmitted = false;

function startChallengeTimer() {
    if (challengeTimerId || challengeSubmitted || challengeTimeLeft <= 0) return;
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    challengeTimerId = window.setInterval(() => {
        challengeTimeLeft = Math.max(0, challengeTimeLeft - 1);
        const minutes = Math.floor(challengeTimeLeft / 60);
        const seconds = challengeTimeLeft % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (challengeTimeLeft === 0) {
            clearInterval(challengeTimerId);
            challengeTimerId = null;
            finishChallenge(false, true);
        }
    }, 1000);
}

function finishChallenge(isCorrect, timedOut = false) {
    if (challengeSubmitted) return;
    challengeSubmitted = true;
    if (challengeTimerId) clearInterval(challengeTimerId);
    challengeTimerId = null;

    const card = document.querySelector('#competitive .space-y-6 > .bg-white');
    const submitButton = document.querySelector('#competitive button[onclick="submitChallenge()"]');
    document.querySelectorAll('input[name="challenge"]').forEach(input => { input.disabled = true; });
    if (submitButton) submitButton.disabled = true;

    const message = document.createElement('div');
    message.className = `mt-4 px-4 py-3 rounded border ${isCorrect ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`;
    message.setAttribute('role', 'status');
    message.innerHTML = timedOut
        ? '<strong>Tempo esgotado!</strong> O desafio terminou antes do envio da resposta.'
        : isCorrect
            ? '<strong>Correto!</strong> A negação de “Se p, então q” é “p e não q”. Você ganhou 50 pontos neste desafio.'
            : '<strong>Incorreto.</strong> A negação de “Se p, então q” é “p e não q”: neste caso, “Chove e eu não levo o guarda-chuva”.';
    if (card) card.appendChild(message);
}

function submitChallenge() {
    if (challengeSubmitted) return;
    const selectedOption = document.querySelector('input[name="challenge"]:checked');
    if (!selectedOption) {
        const card = document.querySelector('#competitive .space-y-6 > .bg-white');
        let warning = document.getElementById('challenge-warning');
        if (!warning) {
            warning = document.createElement('p');
            warning.id = 'challenge-warning';
            warning.className = 'mt-3 text-sm text-amber-700';
            warning.textContent = 'Selecione uma alternativa antes de enviar.';
            card?.appendChild(warning);
        }
        return;
    }
    finishChallenge(selectedOption.value === 'b');
}
