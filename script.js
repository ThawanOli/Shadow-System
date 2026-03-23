// O Estado Inicial do Imperador
let imperador = {
    nivel: 1,
    xp: 0,
    xpNecessario: 100,
    ouro: 0,
    hpAtual: 100,
    hpMaximo: 100,
    mpAtual: 50,
    mpMaximo: 50,
    atributos: {
        forca: 1,
        inteligencia: 1,
        agilidade: 1,
        vitalidade: 1
    },
    missoesConcluidas: [],
    ultimoAcesso: "",
    inventario: []
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
    // CURATIVO DO TESOURO:
    if (imperador.ouro === undefined || isNaN(imperador.ouro)) {
        imperador.ouro = 0;
    }
    // CURATIVO DO INVENTÁRIO:
    if (!imperador.inventario) {
        imperador.inventario = [];
    }
    // CURATIVO DO HP/MP:
    if (imperador.hpAtual === undefined) { 
        imperador.hpAtual = 100;
        imperador.hpMaximo = 100;
    }
    if (imperador.mpAtual === undefined) {
        imperador.mpAtual = 50;
        imperador.mpMaximo = 50;
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
    document.getElementById('player-ouro').innerText = imperador.ouro;
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
function completarMissao(nomeMissao, xpRecompensa, ouroRecompensa, atributoAlvo, botao) {
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
    // Adiciona XP, ouro e o ponto no atributo
    imperador.xp += xpRecompensa;
    imperador.ouro += ouroRecompensa;
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

// A lógica de Transação Comercial do Imperador
function comprarItem(custo, nomeItem) {
    // Verifica se tem dinheiro suficiente
    if (imperador.ouro >= custo) {

        // Retira o dinheiro e passa o item pro inventário
        imperador.ouro -= custo;
        imperador.inventario.push(nomeItem);

        // Salva as info e att a tela
        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        // NOVO: Manda desenhar a bolsa na hora para o item aparecer!
        renderizarInventario();

        alert(`⚡ Item comprado com sucesso! Você adquiriu [${nomeItem}]`);
        console.log("Inventário atual:", imperador.inventario);

    } else {
        // alerta de pobreza
        alert("Tu ta passando fome, Imperador! Ouro insuficiente. Farme mais!");
    }
}

// A lógica de consumo de itens
function usarItem(nomeItem) {
    // Descobre em qual posição do inventário tá o item
    let index = imperador.inventario.indexOf(nomeItem);

    // Se o item existir na bolsa (index > -1)
    if (index !== -1) {
        // O que cada item faz?
        if (nomeItem === 'Poção de Cura (P)') {
            imperador.hpAtual += 50;
            if (imperador.hpAtual > imperador.hpMaximo) {
                imperador.hpAtual = imperador.hpMaximo; // Limita ao máximo
            }
            alert(`Você bebeu a Poção. Hp restaurado!`);
        }
        else if (nomeItem === 'Adaga Enferrujada') {
            alert(`Adaga Equipada com sucesso!`);
        }
        else if (nomeItem === 'Livro Antigo') {
            alert(`Livro Antigo Equipado!`);
        }
        else {
            alert(`Você inspecionou o item [${nomeItem}]`);
        }

        // O set do inventário: Arranca 1 item daquela posição exata
        imperador.inventario.splice(index, 1);

        // Salva as mudanças e att a tela
        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();
    }
}
        // A Magia que desenha os itens da bolsa na tela
function renderizarInventario() {
    // 1. Encontra a gaveta no HTML
    let grade = document.getElementById('grade-inventario');

    //PROTEÇÃO: Se a gaveta não existir, o Sistema não quebra
    if (!grade) return;
    
    // 2. Limpa a gaveta inteira para não duplicar itens
    grade.innerHTML = '';

    // 3. Verifica se a bolsa está vazia
    if (imperador.inventario.length === 0) {
        grade.innerHTML = '<p style="color: #555; font-size: 0.9em;">A bolsa está vazia.</p>';
        return; // Para a função por aqui
    }

    // 4. Se tiver itens, o Sistema cria um botão para cada um!
    for (let item of imperador.inventario) {
        // Cria um botão virtualmente
        let botaoItem = document.createElement('button');
        
        // Define o visual do botão (reaproveitando a sua classe CSS)
        botaoItem.className = 'btn-complete';
        botaoItem.style.padding = '5px 10px';
        botaoItem.style.fontSize = '0.8em';
        
        // Coloca o nome do item no botão
        botaoItem.innerText = `Usar ${item}`;
        
        // O Feitiço de Uso: quando clicar, chama a função usarItem
        botaoItem.onclick = function() {
            usarItem(item);
        };

        // Coloca o botão fisicamente dentro da gaveta no HTML
        grade.appendChild(botaoItem);
    }
}

// Inicia os valores corretos assim que a página é aberta
atualizarTela();
renderizarInventario(); 