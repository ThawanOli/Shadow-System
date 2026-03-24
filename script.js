// O DNA BASE DO IMPERADOR
let imperador = {
    nome: "Thawan Oliveira",
    titulo: "Imperador das Rosas Azuis",
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
    // AS NOVAS GAVETAS PRECISAM EXISTIR AQUI NO TOPO!
    atributosBonus: {
        forca: 0,
        inteligencia: 0,
        agilidade: 0,
        vitalidade: 0
    },
    equipamentos: {
        arma: null,
        armadura: null
    },
    missoesConcluidas: [],
    ultimoAcesso: "",
    inventario: []
};

let saveGuardado = localStorage.getItem('save_imperador');
if (saveGuardado !== null) { 
    imperador = JSON.parse(saveGuardado);
    
    // Curativos Antigos
    if (!imperador.missoesConcluidas) imperador.missoesConcluidas = [];
    if (!imperador.ultimoAcesso) imperador.ultimoAcesso = "";
    if (imperador.ouro === undefined || isNaN(imperador.ouro)) imperador.ouro = 0;
    if (!imperador.inventario) imperador.inventario = [];
    if (imperador.hpAtual === undefined) { imperador.hpAtual = 100; imperador.hpMaximo = 100; }
    if (imperador.mpAtual === undefined) { imperador.mpAtual = 50; imperador.mpMaximo = 50; }
    if (imperador.nome === undefined) imperador.nome = "Thawan Oliveira";
    if (imperador.titulo === undefined) imperador.titulo = "Imperador das Rosas Azuis";

    // OS NOVOS CURATIVOS DO ARSENAL 
    if (!imperador.atributosBonus) {
        imperador.atributosBonus = { forca: 0, inteligencia: 0, agilidade: 0, vitalidade: 0 };
    }
    if (!imperador.equipamentos) {
        imperador.equipamentos = { arma: null, armadura: null };
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
    document.getElementById('player-nome').innerText = imperador.nome;
    document.getElementById('player-titulo').innerText = imperador.titulo;
    document.getElementById('player-level').innerText = imperador.nivel;
    document.getElementById('player-ouro').innerText = imperador.ouro;
    document.getElementById('xp-text').innerText = `XP: ${imperador.xp}/${imperador.xpNecessario}`;

    // A SOMA DO PODER: BASE + BONUS
    let forcaTotal = imperador.atributos.forca + imperador.atributosBonus.forca;
    let intTotal = imperador.atributos.inteligencia + imperador.atributosBonus.inteligencia;
    let agiTotal = imperador.atributos.agilidade + imperador.atributosBonus.agilidade;
    let vitTotal = imperador.atributos.vitalidade + imperador.atributosBonus.vitalidade;

    // MOTOR STATUS DERIVADO
    // FORMULA: BASE FIXA + ATRIBUTO * MULTIPLICADOR
    imperador.hpMaximo = 100 + (vitTotal * 10);
    imperador.mpMaximo = 50 + (intTotal * 5);

    // Proteção: Se o seu HP máximo diminuir (ex: tirou um equipamento de vitalidade), 
    // a sua vida atual não pode ficar maior que o limite máximo!
    if (imperador.hpAtual > imperador.hpMaximo) imperador.hpAtual = imperador.hpMaximo;
    if (imperador.mpAtual > imperador.mpMaximo) imperador.mpAtual = imperador.mpMaximo;

    // Printa a soma total na tela
    document.getElementById('attr-forca').innerText = forcaTotal;
    document.getElementById('attr-inteligencia').innerText = intTotal;
    document.getElementById('attr-agilidade').innerText = agiTotal;
    document.getElementById('attr-vitalidade').innerText = vitTotal;

    // Printa os nomes dos equipamentos equipados se for null=nenhuma
    document.getElementById('slot-arma').innerText = imperador.equipamentos.arma ? imperador.equipamentos.arma : "Nenhuma";
    document.getElementById('slot-armadura').innerText = imperador.equipamentos.armadura ? imperador.equipamentos.armadura : "Nenhuma";
    document.getElementById('slot-acessorio').innerText = imperador.equipamentos.acessorio ? imperador.equipamentos.acessorio : "Nenhuma";

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
    // ... (todo o resto da sua função atualizarTela) ...

    // 1. PINTA OS NÚMEROS REAIS NA TELA
    document.getElementById('player-hp').innerText = `${imperador.hpAtual}/${imperador.hpMaximo}`;
    document.getElementById('player-mp').innerText = `${imperador.mpAtual}/${imperador.mpMaximo}`;

    // 2. ESTICA AS BARRAS COLORIDAS (O FEITIÇO VISUAL)
    let porcentagemHP = (imperador.hpAtual / imperador.hpMaximo) * 100;
    document.getElementById('hp-bar').style.width = porcentagemHP + '%';

    let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
    document.getElementById('mp-bar').style.width = porcentagemMP + '%';
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
    
    // NOVO FEITIÇO: A matemática visual da Vida e da Mana
    let porcentagemHP = (imperador.hpAtual / imperador.hpMaximo) * 100;
    document.getElementById('player-hp').style.width = porcentagemHP + '%';

    let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
    document.getElementById('player-mp').style.width = porcentagemMP + '%';

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
            // 1- Verifica se as mãos estão ocupadas
            if (imperador.equipamentos.arma !== null) {
                let armaAntiga = imperador.equipamentos.arma;
                imperador.inventario.push(armaAntiga); // Devolve pra mochila
                
                // O SISTEMA AGORA VERIFICA O QUE TIRAR!
                if (armaAntiga === 'Adaga Enferrujada') {
                    imperador.atributosBonus.forca -= 2;
                } else if (armaAntiga === 'Livro Antigo') {
                    imperador.atributosBonus.inteligencia -= 2;
                }
            }
            
            // 2- Equipa a nova arma
            imperador.equipamentos.arma = 'Adaga Enferrujada';
            
            // 3- Concede os status
            imperador.atributosBonus.forca += 2;
            alert(`Adaga Equipada com sucesso, força aumentada em 2!`);
        }
        
        else if (nomeItem === 'Livro Antigo') {
            // 1- Verifica se as mãos estão ocupadas
            if (imperador.equipamentos.arma !== null) {
                let armaAntiga = imperador.equipamentos.arma;
                imperador.inventario.push(armaAntiga); // Devolve pra mochila
                
                // O SISTEMA AGORA VERIFICA O QUE TIRAR!
                if (armaAntiga === 'Adaga Enferrujada') {
                    imperador.atributosBonus.forca -= 2;
                } else if (armaAntiga === 'Livro Antigo') {
                    imperador.atributosBonus.inteligencia -= 2;
                }
            }
            
            // 2- Equipa a nova arma
            imperador.equipamentos.arma = 'Livro Antigo';
            
            // 3- Concede os status
            imperador.atributosBonus.inteligencia += 2;
            alert(`Livro Antigo Equipado com sucesso, inteligência aumentada em 2!`);
        }

        // O set do inventário: Arranca 1 item daquela posição exata
        imperador.inventario.splice(index, 1);

        // Salva as mudanças e att a tela
        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        renderizarInventario(); // Atualiza a bolsa para refletir o item usado
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