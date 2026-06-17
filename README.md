#  Shadow System: Arise

Um sistema web gamificado de produtividade e gerenciamento de hábitos, inspirado na mecânica de evolução de Solo Leveling e em RPGs clássicos. 

##  Sobre o Projeto
O Shadow System transforma as tarefas do dia a dia em Missões Diárias. Completar objetivos reais (como estudar, treinar ou ler) concede Experiência (XP) e Ouro. O jogador pode usar esses recursos para evoluir atributos matemáticos, comprar itens virtuais ou resgatar recompensas para o mundo real.

##  Funcionalidades Principais
* **Status Derivados:** Sistema matemático onde atributos primários (como Vitalidade) afetam dinamicamente o HP e MP do jogador.
* **Game Loop de Combate:** Sistema de batalha por turnos contra inimigos utilizando assincronicidade (setTimeout) para simular o tempo de resposta da IA.
* **Economia Dupla:** Loja com sistema de abas separando itens virtuais (equipamentos) e recompensas físicas (tempo livre, jogos).
* **Persistência de Dados:** O progresso do império é salvo localmente no navegador utilizando `LocalStorage` e serialização JSON.
* **Status Recovery:** Sistema de progressão de nível que restaura automaticamente os atributos do jogador.

##  Tecnologias Utilizadas
* **HTML5:** Semântica e estrutura em caixas.
* **CSS3:** Layout responsivo com Flexbox e design Cyberpunk/Neon.
* **Vanilla JavaScript:** Lógica de negócios, manipulação do DOM e gerenciamento de estado sem frameworks.
