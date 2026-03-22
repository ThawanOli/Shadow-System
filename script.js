// O Estado Inicial do Imperador
let imperador = {
    nivel: 1,
    xp: 0,
    xpNecessario: 100,
    atributos: {
        forca: 1,
        inteligencia: 1,
        agilidade: 1,
        vitalidade: 1
    },
    missoesConcluidas: [],
    ultimoAcesso: ""
};

 //1. O CARREGAR FICA AQUI  
let saveGuardado = localStorage.getItem('save_imperador');
if (saveGuardado !== null) { // Verifica se existe um save anterior
    imperador = JSON.parse(saveGuardado);
    // O CURATIVO: Se o save antigo não tiver a lista de missões, nós criamos uma vazia agora!
    if (!imperador.missoesConcluidas) {
        imperador.missoesConcluidas = [];
    }
    // O FEITIÇO DE CURA: Se o save antigo não tiver a data, nós criamos uma agora!
    if (!imperador.ultimoAcesso) {
        imperador.ultimoAcesso = ""
    }
}

// O RELÓGIO DO SISTEMA
//Descobre que dia é hoje
let dataDeHoje = new Date().toLocaleDateString('pt-BR');

// Se dataDeHoje for diferente do último acesso, é um novo dia!
if (dataDeHoje !== imperador.ultimoAcesso) {
    // Limpa a lista(Seta pra missões pendentes)
    imperador.missoesConcluidas = [];

    // Atualiza o acesso para o dia atual
    imperador.ultimoAcesso = dataDeHoje;

    // Salva a nova realidade no cofre
    localStorage.setItem('save_imperador', JSON.stringify(imperador));

    console.log("Novo dia detectado! Missões resetadas, Imperador das Rosas Azuis!");
}

// Função que atualiza a pintura na tela
function atualizarTela() {
    // Atualiza os textos numéricos
    document.getElementById('player-level').innerText = imperador.nivel;
    document.getElementById('xp-text').innerText = `XP: ${imperador.xp}/${imperador.xpNecessario}`;

    document.getElementById('attr-forca').innerText = imperador.atributos.forca;
    document.getElementById('attr-inteligencia').innerText = imperador.atributos.inteligencia;
    document.getElementById('attr-agilidade').innerText = imperador.atributos.agilidade;
    document.getElementById('attr-vitalidade').innerText = imperador.atributos.vitalidade;

    // A matemática que faz a barra encher
    let porcentagemXP = (imperador.xp / imperador.xpNecessario) * 100;
    document.getElementById('xp-bar').style.width = porcentagemXP + '%';

    // NOVO FEITIÇO: Varredura de missões concluídas
    // O Sistema lê cada nome de missão que está salvo na sua lista
    for (let missao of imperador.missoesConcluidas) {
        
        // Ele monta o ID do botão (ex: "btn-" + "treino_forca")
        let botaoSalvo = document.getElementById("btn-" + missao);
        
        // Se o botão existir na tela, ele congela e pinta de cinza
        if(botaoSalvo) {
            botaoSalvo.innerText = "Concluída";
            botaoSalvo.disabled = true;
            botaoSalvo.style.color = "#555";
            botaoSalvo.style.borderColor = "#555";
            botaoSalvo.style.boxShadow = "none";
            botaoSalvo.style.cursor = "not-allowed";
        }
    }   
}

// Ação ativada ao clicar no botão
function completarMissao(nomeMissao, xpRecompensa, atributoAlvo, botao) {
    // O bloqueio de segurança, traduzido para JS:
if (imperador.missoesConcluidas.includes(nomeMissao)) {
    alert("Missão já concluída, Imperador!");
    return; // O feitiço que cancela a função na mesma hora!
}

// Se o código não parou no 'return' acima, significa que a missão é nova.
// Então, guardamos o nome dela na lista
imperador.missoesConcluidas.push(nomeMissao);

// Brilhante ideia de usar o console.log para vigiar a lista nas sombras!
console.log(imperador.missoesConcluidas);
    // Adiciona XP e o ponto no atributo
    imperador.xp += xpRecompensa;
    imperador.atributos[atributoAlvo] += 1;

    // Se o XP bater o limite, você sobe de nível!
    if (imperador.xp >= imperador.xpNecessario) {
        imperador.nivel += 1;
        imperador.xp -= imperador.xpNecessario; 
        imperador.xpNecessario = Math.floor(imperador.xpNecessario * 1.5);
         // O alerta de Level Up para o Monarca
        alert("🌟 LEVEL UP! O Sistema reconhece sua evolução, Imperador das Rosas Azuis! 🌟");
    }

    // Atualiza a interface com a matemática processada acima
    atualizarTela();

    // Congela o botão para impedir que ganhe XP infinito
    botao.innerText = "Concluída";
    botao.disabled = true;
    botao.style.color = "#555";
    botao.style.borderColor = "#555";
    botao.style.boxShadow = "none";
    botao.style.cursor = "not-allowed";

    // Salva a nova realidade no cofre
    localStorage.setItem('save_imperador', JSON.stringify(imperador));
}
// Inicia os valores corretos assim que a página é aberta
atualizarTela();