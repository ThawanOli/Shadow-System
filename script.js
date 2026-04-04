// O DNA BASE 
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
    
    
    if (!imperador.missoesConcluidas) imperador.missoesConcluidas = [];
    if (!imperador.ultimoAcesso) imperador.ultimoAcesso = "";
    if (imperador.ouro === undefined || isNaN(imperador.ouro)) imperador.ouro = 0;
    if (!imperador.inventario) imperador.inventario = [];
    if (imperador.hpAtual === undefined) { imperador.hpAtual = 100; imperador.hpMaximo = 100; }
    if (imperador.mpAtual === undefined) { imperador.mpAtual = 50; imperador.mpMaximo = 50; }
    if (imperador.nome === undefined) imperador.nome = "Thawan Oliveira";
    if (imperador.titulo === undefined) imperador.titulo = "Imperador das Rosas Azuis";

    
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


if (dataDeHoje !== imperador.ultimoAcesso) {
    // Limpa a lista(Seta pra missões pendentes)
    imperador.missoesConcluidas = [];

    
    imperador.ultimoAcesso = dataDeHoje;

   // Sincroniza o estado atual do objeto 'imperador' com o LocalStorage 
// para persistência entre sessões do navegador.
    localStorage.setItem('save_imperador', JSON.stringify(imperador));

    console.log("Novo dia detectado! Missões resetadas, Imperador das Rosas Azuis!");
}

function atualizarTela() {
    
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

    // Cálculo de Status Derivados: 
// A Vitalidade escala o HP máximo em uma proporção de 1:10 para garantir progressão equilibrada.
    imperador.hpMaximo = 100 + (vitTotal * 10);
    imperador.mpMaximo = 50 + (intTotal * 5);

    if (imperador.hpAtual > imperador.hpMaximo) imperador.hpAtual = imperador.hpMaximo;
    if (imperador.mpAtual > imperador.mpMaximo) imperador.mpAtual = imperador.mpMaximo;

    
    document.getElementById('attr-forca').innerText = forcaTotal;
    document.getElementById('attr-inteligencia').innerText = intTotal;
    document.getElementById('attr-agilidade').innerText = agiTotal;
    document.getElementById('attr-vitalidade').innerText = vitTotal;

    document.getElementById('slot-arma').innerText = imperador.equipamentos.arma ? imperador.equipamentos.arma : "Nenhuma";
    document.getElementById('slot-armadura').innerText = imperador.equipamentos.armadura ? imperador.equipamentos.armadura : "Nenhuma";
    document.getElementById('slot-acessorio').innerText = imperador.equipamentos.acessorio ? imperador.equipamentos.acessorio : "Nenhuma";

    let porcentagemXP = (imperador.xp / imperador.xpNecessario) * 100;
    document.getElementById('xp-bar').style.width = porcentagemXP + '%';

    for (let missao of imperador.missoesConcluidas) {
        
        let botaoSalvo = document.getElementById("btn-" + missao);
        
        if(botaoSalvo) {
            botaoSalvo.innerText = "Concluída";
            botaoSalvo.disabled = true;
            botaoSalvo.style.color = "#555";
            botaoSalvo.style.borderColor = "#555";
            botaoSalvo.style.boxShadow = "none";
            botaoSalvo.style.cursor = "not-allowed";
        }
    }   
    
    document.getElementById('player-hp').innerText = `${imperador.hpAtual}/${imperador.hpMaximo}`;
    document.getElementById('player-mp').innerText = `${imperador.mpAtual}/${imperador.mpMaximo}`;

    let porcentagemHP = (imperador.hpAtual / imperador.hpMaximo) * 100;
    document.getElementById('hp-bar').style.width = porcentagemHP + '%';

    let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
    document.getElementById('mp-bar').style.width = porcentagemMP + '%';
} 

function completarMissao(nomeMissao, xpRecompensa, ouroRecompensa, atributoAlvo, botao) {
if (imperador.missoesConcluidas.includes(nomeMissao)) {
    alert("Missão já concluída, Imperador!");
    return; 
}

imperador.missoesConcluidas.push(nomeMissao);

console.log(imperador.missoesConcluidas);
    imperador.xp += xpRecompensa;
    imperador.ouro += ouroRecompensa;
    imperador.atributos[atributoAlvo] += 1;

    if (imperador.xp >= imperador.xpNecessario) {
        subirDeNivel();
    }
    
    let porcentagemHP = (imperador.hpAtual / imperador.hpMaximo) * 100;
    document.getElementById('player-hp').style.width = porcentagemHP + '%';

    let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
    document.getElementById('player-mp').style.width = porcentagemMP + '%';

    atualizarTela();

    botao.innerText = "Concluída";
    botao.disabled = true;
    botao.style.color = "#555";
    botao.style.borderColor = "#555";
    botao.style.boxShadow = "none";
    botao.style.cursor = "not-allowed";

    localStorage.setItem('save_imperador', JSON.stringify(imperador));
}

atualizarTela();

function comprarItem(custo, nomeItem) {
    if (imperador.ouro >= custo) {
        imperador.ouro -= custo;
        imperador.inventario.push(nomeItem);

        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        renderizarInventario();

        alert(`⚡ Item comprado com sucesso! Você adquiriu [${nomeItem}]`);
        console.log("Inventário atual:", imperador.inventario);

    } else {
        alert("Tu ta passando fome, Imperador! Ouro insuficiente. Farme mais!");
    }
}

function mudarAbaLoja(abaAlvo) {
    let lojaVirtual = document.getElementById('loja-virtual');
    let lojaReal = document.getElementById('loja-real');
    let btnVirtual = document.getElementById('btn-aba-virtual');
    let btnReal = document.getElementById('btn-aba-real');

    if (abaAlvo === 'loja-virtual') {
        lojaVirtual.style.display = 'flex';
        lojaReal.style.display = 'none';
        
        btnVirtual.style.backgroundColor = 'rgba(0, 210, 255, 0.2)';
        btnReal.style.backgroundColor = 'transparent';
    } else {
        lojaVirtual.style.display = 'none';
        lojaReal.style.display = 'flex';
        
        btnReal.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
        btnVirtual.style.backgroundColor = 'transparent';
    }
}

function comprarRecompensaReal(custo, nomeRecompensa) {
    if (imperador.ouro >= custo) {
        imperador.ouro -= custo;
        
        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        alert(`🏆 TRANSACÇÃO APROVADA!\n\nVocê pagou ${custo} Ouro.\nO Sistema autoriza o resgate de: [${nomeRecompensa}].\n\nAproveite sua recompensa no mundo real, Imperador!`);
    } else {
        alert("Ouro insuficiente! A vida real exige mais esforço e sacrifício. Cumpra mais missões diárias!");
    }
}

function usarItem(nomeItem) {
    let index = imperador.inventario.indexOf(nomeItem);

    if (index !== -1) {
        if (nomeItem === 'Poção de Cura (P)') {
            imperador.hpAtual += 50;
            if (imperador.hpAtual > imperador.hpMaximo) {
                imperador.hpAtual = imperador.hpMaximo; 
            }
            alert(`Você bebeu a Poção. Hp restaurado!`);
        }
       else if (nomeItem === 'Adaga Enferrujada') {
            if (imperador.equipamentos.arma !== null) {
                let armaAntiga = imperador.equipamentos.arma;
                imperador.inventario.push(armaAntiga); 

                if (armaAntiga === 'Adaga Enferrujada') {
                    imperador.atributosBonus.forca -= 2;
                } else if (armaAntiga === 'Livro Antigo') {
                    imperador.atributosBonus.inteligencia -= 2;
                }
            }
            
            imperador.equipamentos.arma = 'Adaga Enferrujada';
            
            imperador.atributosBonus.forca += 2;
            alert(`Adaga Equipada com sucesso, força aumentada em 2!`);
        }
        
        else if (nomeItem === 'Livro Antigo') {
            if (imperador.equipamentos.arma !== null) {
                let armaAntiga = imperador.equipamentos.arma;
                imperador.inventario.push(armaAntiga); 
                
                if (armaAntiga === 'Adaga Enferrujada') {
                    imperador.atributosBonus.forca -= 2;
                } else if (armaAntiga === 'Livro Antigo') {
                    imperador.atributosBonus.inteligencia -= 2;
                }
            }
            
            imperador.equipamentos.arma = 'Livro Antigo';
            
            imperador.atributosBonus.inteligencia += 2;
            alert(`Livro Antigo Equipado com sucesso, inteligência aumentada em 2!`);
        }

        imperador.inventario.splice(index, 1);

        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        renderizarInventario(); 
    }
}
        
function renderizarInventario() {
    let grade = document.getElementById('grade-inventario');
    if (!grade) return;
    grade.innerHTML = '';

    if (imperador.inventario.length === 0) {
        grade.innerHTML = '<p style="color: #555; font-size: 0.9em;">A bolsa está vazia.</p>';
        return; 
    }

    for (let item of imperador.inventario) {
        let botaoItem = document.createElement('button');
        
        botaoItem.className = 'btn-complete';
        botaoItem.style.padding = '5px 10px';
        botaoItem.style.fontSize = '0.8em';
        botaoItem.innerText = `Usar ${item}`;
        botaoItem.onclick = function() {
            usarItem(item);
        };

        grade.appendChild(botaoItem);
    }
}

// Sistema de batalha 

let monstroAtual = {
    nome: "Goblin Saqueador",
    nivel: 1,
    hpAtual: 30,
    hpMaximo: 30,
    ataqueBase: 5,
    xpDrop: 20,
    ouroDrop: 15
};

//Abrir portais
function entrarMasmorra() {
    document.getElementById('tela-masmorra').style.display = 'block';
    document.getElementById('log-batalha').innerText = "A batalha começou! O que o Imperador fará?"
    atualizarTelaMasmorra(); 
}

//Logica batalhas
function registrarLog(mensagem) {
    document.getElementById('log-batalha').innerText = mensagem;
}

function atualizarTelaMasmorra(){
    document.getElementById('monstro-hp-texto').innerText = `${monstroAtual.hpAtual}/${monstroAtual.hpMaximo}`;
    let porcentagem = (monstroAtual.hpAtual / monstroAtual.hpMaximo) * 100;
    document.getElementById('monstro-hp-bar').style.width = porcentagem + '%';
    
    let hpTextoBatalha = document.getElementById('batalha-player-hp-texto');
    let hpBarraBatalha = document.getElementById('batalha-player-hp-bar');

    //Pra att só o que tem na tela
    if (hpTextoBatalha && hpBarraBatalha) {
        hpTextoBatalha.innerText = `${imperador.hpAtual}/${imperador.hpMaximo}`;
        let porcentagemImperador = (imperador.hpAtual / imperador.hpMaximo) * 100;
        hpBarraBatalha.style.width = porcentagemImperador + '%';
    }    
}

/**
 * Realiza o ciclo de combate por turnos entre o Jogador e o Monstro.
 * Implementa assincronicidade para simular o tempo de resposta da IA.
 */
function atacarMonstro (){
    let forcaTotal = imperador.atributos.forca + (imperador.atributosBonus ? imperador.atributosBonus.forca : 0);
    let danoImperador = forcaTotal * 2;

    monstroAtual.hpAtual -= danoImperador;
    if (monstroAtual.hpAtual < 0) monstroAtual.hpAtual = 0; 

    registrarLog(`Você atacou com precisão e causou ${danoImperador} de dano!`);
    atualizarTelaMasmorra();/**
 * Atualiza os elementos visuais de HP/MP tanto na interface principal 
 * quanto no HUD específico da masmorra.
 */

    if (monstroAtual.hpAtual <= 0) {
        registrarLog(`O ${monstroAtual.nome} foi abatido! Você adquiriu +${monstroAtual.xpDrop} XP e +${monstroAtual.ouroDrop} Ouro.`);
        imperador.xp += monstroAtual.xpDrop;
        imperador.ouro += monstroAtual.ouroDrop;

        if (imperador.xp >= imperador.xpNecessario) {
            subirDeNivel();
        }

        localStorage.setItem('save_imperador', JSON.stringify(imperador));
        atualizarTela();

        setTimeout(() => {
            fugirMasmorra();
            monstroAtual.hpAtual = monstroAtual.hpMaximo; 
            atualizarTelaMasmorra();
        }, 2000);
    
        return; 
    }
    
    setTimeout(() => {
        let danoMonstro = monstroAtual.ataqueBase;
        imperador.hpAtual -= danoMonstro;
        if (imperador.hpAtual < 0) imperador.hpAtual = 0;

        registrarLog(`O ${monstroAtual.nome} revidou furiosamente e causou ${danoMonstro} do seu HP!`);
      
        atualizarTela();
        localStorage.setItem('save_imperador', JSON.stringify(imperador));

        if (imperador.hpAtual <= 0) {
            registrarLog(`A sua visão escurece . . . Você foi abatido.`);
            alert("O Sistema ativou a proteção e te salvou. Você recebeu uma segunda chance ficando com 1 de HP!");

            imperador.hpAtual = 1;
            localStorage.setItem('save_imperador', JSON.stringfy(imperador));
            atualizarTela();

            fugirMasmorra();
            monstroAtual.hpAtual = monstroAtual.hpMaximo; 
            atualizarTelaMasmorra();
        }
    }, 1000);
 }

function fugirMasmorra() {
    document.getElementById('tela-masmorra').style.display = 'none';
}

// O RITUAL DE EVOLUÇÃO
function subirDeNivel() {
    // Escalamento de xp
    imperador.nivel += 1;
    imperador.xp -= imperador.xpNecessario;
    imperador.xpNecessario = Math.floor(imperador.xpNecessario * 1.5);

    // Subiu de lvl ganhou
    imperador.atributos.forca += 1;
    imperador.atributos.inteligencia += 1;
    imperador.atributos.agilidade += 1;
    imperador.atributos.vitalidade += 1;

    atualizarTela();

    imperador.hpAtual = imperador.hpMaximo;
    imperador.mpAtual = imperador.mpMaximo;

    localStorage.setItem('save_imperador',JSON.stringify(imperador));
    atualizarTela();

    alert(`LVL UP! O Sistema reconhece sua supremacia,
         Imperador!\n\nNível: ${imperador.nivel}\nTodos os atributos +1\nStatus Recovery ativado: HP e MP restaurados!`);
}

atualizarTela();
renderizarInventario(); 