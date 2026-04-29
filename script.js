// ENTIDADE PRINCIPAL: O MONARCA
class Monarca {
    constructor(nome) {
        
            this.nome = nome || "Thawan Oliveira";
            this.titulo = "Imperador das Rosas Azuis";
            this.nivel = 1;
            this.ouro = 0;
            this.xp = 0;
            this.xpNecessario = 100;
            this.atributos = { forca: 1, inteligencia: 1, agilidade: 1, vitalidade: 1 };
            this.hpMaximo = 110;
            this.hpAtual = 110;
            this.mpMaximo = 50;
            this.mpAtual = 50;
            this.inventario = [];
            this.equipamentos = { arma: null, armadura: null, acessorio: null };
            this.atributosBonus = { forca: 0, inteligencia: 0, agilidade: 0, vitalidade: 0 };
            this.missoesConcluidas = [];
            this.ultimoAcesso = "";
        }

    async carregarMundo() {
        try {
            const resposta = await fetch('http://127.0.0.1:5000/carregar');
            const dados = await resposta.json();
            if (dados && dados.nivel) {
                this.nivel = dados.nivel;
                this.ouro = dados.ouro;
                this.xp = dados.xp;
                this.hash_seguranca = dados.hash;
                // Atualize outros atributos se necessário
                console.log(" Status carregados do Monólito!");
            }
        } catch (erro) {
            console.error("Servidor offline. Usando backup local.");
        }
    }
   // O Feitiço agora é Async (Assíncrono) para conversar com a API
    async salvarEstado() {
        try {
            //Gera o lacre antes de envia
            const lacre = await gerarLacre(this);
            const resposta = await fetch('http://127.0.0.1:5000/salvar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Lacre-Integridade': lacre // Enviamos o selo aqui!
            },
            body: JSON.stringify(this)
        });
        if (resposta.ok) {
            console.log("Save sincronizado e autenticado!");
        } else {
            console.error("Erro na autenticação do save!");
        }
    } catch (erro) {
        console.error("Falha na conexão:", erro);
    } finally {
        localStorage.setItem('save_imperador', JSON.stringify(this));
    }
}
           
    subirDeNivel() {
        this.nivel += 1;
        this.xp -= this.xpNecessario;
        this.xpNecessario = Math.floor(this.xpNecessario * 1.5);

        // Status Recovery
        this.atributos.forca += 2;
        this.atributos.inteligencia += 2;
        this.atributos.agilidade += 2;
        this.atributos.vitalidade += 2;

        // Recalcula limites vitais baseados na nova vitalidade
        this.hpMaximo = 100 + (this.atributos.vitalidade * 10);
        this.mpMaximo = 50 + (this.atributos.inteligencia * 5);
        this.hpAtual = this.hpMaximo;
        this.mpAtual = this.mpMaximo;

        this.salvarEstado();
    }
}

// --- O DESPERTAR AUTOMÁTICO DO IMPERADOR ---
window.addEventListener("load", () => {
    const usuarioSalvo = localStorage.getItem('usuario_shadow');
    const overlay = document.getElementById('login-overlay');
    atualizarBotaoMeditacao();
    if (usuarioSalvo) {
        imperador.nome = usuarioSalvo;
        console.log("Sessão restaurada para:", usuarioSalvo);
        if (overlay) {
            overlay.style.display = 'none';
        }
        atualizarTela();
    } else {
        console.log("Nenhum usuario encontrado...")
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
});

// (A Instância)
let imperador = new Monarca();
async function iniciarSistema() {
    await carregarLojaDoBanco();  
}
iniciarSistema();

async function entrarNoReino() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    try {
        const resposta = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, senha: pass })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            document.getElementById('login-overlay').style.display = 'none';
            
            imperador.nome = resultado.dados.username;
            imperador.ouro = resultado.dados.ouro;
            imperador.nivel = resultado.dados.nivel;
            imperador.xp = resultado.dados.xp;
            imperador.hash_seguranca = resultado.dados.hash;
            imperador.inventario = resultado.dados.inventario || [];
            localStorage.setItem('usuario_shadow', resultado.dados.username);
            console.log("Login confirmado para:", imperador.nome);
            atualizarTela(); 
        } else {
            alert(resultado.mensagem);
        }
    } catch (erro) {
        console.error("Erro no portal de login:", erro);
    }
}

async function cadastrarNoReino() {
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;

    if (!user || !pass) return alert("Preencha os campos, Imperador!");

    const resposta = await fetch('http://127.0.0.1:5000/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, senha: pass })
    });

    const resultado = await resposta.json();
    alert(resultado.mensagem);
}

// Sistema de Conquistas 
let conquistas = {
    monstrosAbatidos: 0,
    ouroAcumulado: 0,
    missoesTotais: 0
};

// Carregar conquistas do LocalStorage 
function carregarConquistas() {
    const salvas = JSON.parse(localStorage.getItem('conquistas_shadow')) || { monstrosAbatidos: 0, ouroAcumulado: 0, missoesTotais: 0 };
    conquistas = salvas;
    atualizarPainelConquistas();
}

function renderizarMural() {
    const container = document.getElementById('mural-conquistas');
    if (!container) return;
    container.innerHTML = '';

    for (let id in bancoConquistas) {
        const conquista = bancoConquistas[id];
        const jaGanhou = imperador.missoesConcluidas.includes(id);

        const div = document.createElement('div');
        div.className = `medalha ${jaGanhou ? 'concluida' : ''}`;
        div.innerHTML = `
            <h4>${conquista.nome}</h4>
            <p>${conquista.desc}</p>
        `;
        container.appendChild(div);
    }
}

async function carregarLojaDoBanco() {
    try {
        const resposta = await fetch('http://127.0.0.1:5000/loja');
        if (!resposta.ok) throw new Error("Falha ao buscar itens da loja");

        const itensLoja = await resposta.json();
        console.log(" Itens da loja carregados do Monólito:", itensLoja);
        
        renderizarLoja(itensLoja);
    } catch (erro) {
        console.error("Falha ao carregar o Mercado das Sombras:", erro);
    }
}

async function comprarNoBanco(idItem) {
    const nomeUsuario = imperador.nome || localStorage.getItem('usuario_shadow');
    
    if (!nomeUsuario) {
        alert("Erro: Usuario nao identificado.");
        return;
    }

    if (!idItem) {
        console.error("Erro: idItem nao foi passado para a funcao.");
        return;
    }

    try {
        const resposta = await fetch('http://127.0.0.1:5000/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_item: idItem, 
                username: nomeUsuario 
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            imperador.ouro = resultado.novo_ouro;
            imperador.inventario.push(resultado.item_nome);
            renderizarInventario();
            
            atualizarTela();
            alert("Compra realizada com sucesso.");
        } else {
            alert("Erro do Servidor: " + resultado.mensagem);
        }
    } catch (erro) {
        console.error("Falha na comunicacao:", erro);
    }
}

function renderizarLoja(itens) {
    const container = document.getElementById('loja-virtual');
    if (!container) return;
    container.innerHTML = '';

    itens.forEach(item => {
        // Log 
        console.log("Processando item da loja:", item);
        const div = document.createElement('div');
        div.className = 'quest-card';
        
        // Use item.id ou item[0] 
        const idReal = item.id !== undefined ? item.id : item[0];
        console.log("Dado do item:", item);
        div.innerHTML = `
            <div class="quest-info">
                <h3>${item.nome || item[1]}</h3>
                <p>${item.descricao || item[3]} <br>Custo: ${item.preco || item[2]} Ouro</p>
            </div>
            <button type="button" class="btn-complete" onclick="comprarNoBanco(${idReal})">
                Comprar
            </button>
        `;
        container.appendChild(div);
    });
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

    // Lógica equipamentos
    let estiloBtn = `class="btn-complete" style="padding: 0px 5px; font-size: 0.8em; margin-left: 5px; cursor: pointer;"`;

    document.getElementById('slot-arma').innerHTML = imperador.equipamentos.arma 
        ? `${imperador.equipamentos.arma} <button onclick="desequiparItem('arma')" ${estiloBtn}>X</button>` 
        : "Nenhuma";

    document.getElementById('slot-armadura').innerHTML = imperador.equipamentos.armadura 
        ? `${imperador.equipamentos.armadura} <button onclick="desequiparItem('armadura')" ${estiloBtn}>X</button>` 
        : "Nenhuma";

    document.getElementById('slot-acessorio').innerHTML = imperador.equipamentos.acessorio 
        ? `${imperador.equipamentos.acessorio} <button onclick="desequiparItem('acessorio')" ${estiloBtn}>X</button>` 
        : "Nenhuma";

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

    function verificarConquistas() {
        let houveConquista = false;

        for (let id in bancoConquistas) {
            let conquista = bancoConquistas[id];

            // Se o Imperador atingiu o requisito e ainda não tem a medalha
            if (conquista.req() && !imperador.missoesConcluidas.includes(id)) {
                
                // Aplica Bônus de Atributos
                if (conquista.bonus) {
                    for (let atributo in conquista.bonus) {
                        if (imperador.atributos[atributo] !== undefined) {
                            imperador.atributos[atributo] += conquista.bonus[atributo];
                        }
                    }
                }

                // Registra a conquista no histórico
                imperador.missoesConcluidas.push(id);
                registrarLog(`🏆 CONQUISTA ALCANÇADA: [${conquista.nome}]!`);
                alert(`🏆 CONQUISTA LENDÁRIA!\n${conquista.nome}: ${conquista.desc}`);
                houveConquista = true;
            }
        }

        if (houveConquista) {
            imperador.salvarEstado();
            atualizarTela();
        }
    }
} 

function meditar() {
    if (emBatalha) {
        alert("Você não pode meditar em combate!");
        return;
    }

    let agora = new Date().getTime();
    let ultimoDescanso = localStorage.getItem('tempo_meditacao') || 0;
    let tempoEspera = 5 * 60 * 1000; // 5 minutos em milisegundos

    if (agora - ultimoDescanso < tempoEspera) {
        // Se ainda está em cooldown, não faz nada 
        return;
    }

    if (imperador.hpAtual >= imperador.hpMaximo && imperador.mpAtual >= imperador.mpMaximo) {
        alert("Sua energia já está plena.");
        return;
    }

    // Lógica de Cura
    let curaHp = Math.floor(imperador.hpMaximo * 0.3); 
    let curaMp = Math.floor(imperador.mpMaximo * 0.3);
    imperador.hpAtual = Math.min(imperador.hpAtual + curaHp, imperador.hpMaximo);
    imperador.mpAtual = Math.min(imperador.mpAtual + curaMp, imperador.mpMaximo);

    localStorage.setItem('tempo_meditacao', agora);
    imperador.salvarEstado();
    atualizarTela();
    
    atualizarBotaoMeditacao(); 
    alert(` Meditação concluída! +${curaHp} HP e +${curaMp} MP.`);
}

function atualizarBotaoMeditacao() {
    const btn = document.getElementById('btn-meditar'); 
    if (!btn) return;

    const tempoEspera = 5 * 60 * 1000;
    
    const intervalo = setInterval(() => {
        let agora = new Date().getTime();
        let ultimoDescanso = localStorage.getItem('tempo_meditacao') || 0;
        let tempoPassado = agora - ultimoDescanso;
        let restante = tempoEspera - (agora - ultimoDescanso);

        if (restante > 0) {
            // Calcula minutos e segundos
            let min = Math.floor(restante / 60000);
            let seg = Math.floor((restante % 60000) / 1000);
            
            btn.innerText = `Aguarde: ${min}:${seg < 10 ? '0' : ''}${seg}`;
            btn.disabled = true;
            btn.style.opacity = "0.6";
            btn.style.cursor = "not-allowed";
        } else {
            // Cooldown terminou
            btn.innerText = "Meditar";
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            clearInterval(intervalo);
        }
    }, 1000);
}

async function completarMissao(nomeMissao, xpBase, ouroBase, atributoAlvo, botao) {
    //verifi spam
    if (imperador.missoesConcluidas.includes(nomeMissao)) {
        alert("Missão já concluída, Imperador!");
        return;
    }
    //Lógica multiplicador
    let multiplicador = Math.max(1, Math.floor(Math.pow(imperador.nivel, 1.2)));
    let xpFinal = xpBase * multiplicador;
    let ouroFinal = ouroBase * multiplicador;

    try {
        //Envio para o server
        const resposta = await fetch('http://127.0.0.1:5000/completar_missao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: imperador.nome,
                xp: xpFinal,
                ouro: ouroFinal,
                atributo: atributoAlvo,
                missao_nome: nomeMissao
            })
        });

        const resultado = await resposta.json();
        if (resposta.ok) {
            imperador.xp = resultado.xp;
            imperador.ouro = resultado.ouro;
            imperador.missoesConcluidas.push(nomeMissao);
            imperador.atributos[atributoAlvo] += 1;
            if (imperador.xp >= imperador.xpNecessario) {
                imperador.subirDeNivel();
                alert(` O Monólito ressoa! Você subiu para o nível ${imperador.nivel}!`);
            }
            alert(` Missão registrada! +${xpFinal} XP | +${ouroFinal} Ouro`);
            atualizarTela();

            botao.innerText = "Concluída";
            botao.disabled = true;
            botao.style.color = "#555";
            botao.style.borderColor = "#555";
            botao.style.boxShadow = "none";
            botao.style.cursor = "not-allowed";
        } else {
            alert(` Erro no Monólito: ${resultado.mensagem}`);
        }
    } catch (erro) {
        console.error("Erro na comunicação:", erro);
        alert("A conexão com o reino falhou.");
    }
}
atualizarTela();

// MISSÃO REPETÍVEL: 
function completarMissaoRepetivel(nome, xpBase, ouroBase, atributo) {
    imperador.xp += xpBase;
    imperador.ouro += ouroBase;
    
    // Pequena chance de ganhar atributo em missões repetíveis 
    if (Math.random() < 0.1) {
        imperador.atributos[atributo] += 1;
        registrarLog(` Treino intenso! Sua ${atributo} subiu naturalmente!`);
    }

    if (imperador.xp >= imperador.xpNecessario) imperador.subirDeNivel();
    
    registrarLog(` ${nome} concluído! +${xpBase} XP`);
    atualizarTela();
    imperador.salvarEstado();
}

// PROGRESSÃO: Chamada dentro de outras funções 
function progredirConquista(tipo, valor) {
    if (tipo === 'monstros') conquistas.monstrosAbatidos += valor;
    if (tipo === 'ouro') conquistas.ouroAcumulado += valor;
    
    // Verifica se completou a meta
    if (conquistas.monstrosAbatidos === 100) {
        imperador.atributos.forca += 10;
        alert(" CONQUISTA ALCANÇADA: Carniceiro de Portais! +10 Força Permanente.");
    }
    
    localStorage.setItem('conquistas_shadow', JSON.stringify(conquistas));
    atualizarPainelConquistas();
}

function atualizarVisualElite() {
    // Exemplo para a conquista de monstros
    const barra = document.getElementById('prog-monstros');
    const texto = document.getElementById('status-monstros');
    
    if(barra && texto) {
        let progresso = (conquistas.monstrosAbatidos / 100) * 100;
        barra.style.width = Math.min(progresso, 100) + "%";
        texto.innerText = `${conquistas.monstrosAbatidos} / 100 Abatidos`;
    }
}

function comprarItem(nomeItem) {
    console.log("O HTML enviou o nome:", nomeItem);
    //Pega os dados no cofre
    let itemObj = bancoDeItens[nomeItem];
    //Verifica se o item existe e se tem dinheiro pra comprar
    if (itemObj &&imperador.ouro >= itemObj.preco) {
        imperador.ouro -= itemObj.preco;
        imperador.inventario.push(nomeItem);

        imperador.salvarEstado();
        atualizarTela();
        renderizarInventario();

        alert(`⚡ Item comprado com sucesso! Você adquiriu [${nomeItem}]`);
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
        // O sistema busca o item no cofre
        let itemInteligente = bancoDeItens[nomeItem];

        if (itemInteligente) {
            //O item recebe a ordem de agir sobre o imperador
            itemInteligente.usar(imperador);
            //Remove da bolsa
            imperador.inventario.splice(index, 1);
            //Salva o estado atualizado
            imperador.salvarEstado();
            atualizarTela();
            renderizarInventario();
            //Se usou item, leva pancada, se foi fuga, escapa
            if (emBatalha && !(itemInteligente instanceof MagiaFuga)) {
                registrarLog(`Você usou [${nomeItem}]. O inimigo se prepara...`);
                turnoDoMonstro(); 
            }
        } else {
            console.error("Item fantasma! O Sistema não reconhece: " + nomeItem);
        }
    }
}

function desequiparItem(tipoSlot) {
    let nomeItem = imperador.equipamentos[tipoSlot];

    if (!nomeItem || nomeItem === "Nenhuma") return;

    let itemObj = bancoDeItens[nomeItem];
    
    if (itemObj) {
        // REMOÇÃO DE BÔNUS 
        if (itemObj.bonusForca) imperador.atributosBonus.forca -= itemObj.bonusForca;
        if (itemObj.bonusAgilidade) imperador.atributosBonus.agilidade -= itemObj.bonusAgilidade;
        if (itemObj.bonusInteligencia) imperador.atributosBonus.inteligencia -= itemObj.bonusInteligencia;
        if (itemObj.bonusVitalidade) {
            imperador.atributosBonus.vitalidade -= itemObj.bonusVitalidade;
            // Recalcula o HP Máximo imediatamente ao tirar a armadura
            imperador.hpMaximo = 100 + ((imperador.atributos.vitalidade + imperador.atributosBonus.vitalidade) * 10);
            if (imperador.hpAtual > imperador.hpMaximo) imperador.hpAtual = imperador.hpMaximo;
        }
        // Garante que nada fique negativo
        if (imperador.atributosBonus.forca < 0) imperador.atributosBonus.forca = 0;
        if (imperador.atributosBonus.agilidade < 0) imperador.atributosBonus.agilidade = 0;
        if (imperador.atributosBonus.inteligencia < 0) imperador.atributosBonus.inteligencia = 0;
        if (imperador.atributosBonus.vitalidade < 0) imperador.atributosBonus.vitalidade = 0;

        imperador.inventario.push(nomeItem);
        imperador.equipamentos[tipoSlot] = null;
        imperador.salvarEstado();
        atualizarTela();
        renderizarInventario();

        alert(`[${nomeItem}] foi guardado na bolsa.`);
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

//ENTIDADE SECUNDÁRIA: OS INIMIGOS
class Inimigo {
//construtor
    constructor(nome, nivel, hpMaximo, ataqueBase, xpDrop, ouroDrop) {
        this.nome = nome;
        this.nivel = nivel;
        this.hpMaximo = hpMaximo;
        this.hpAtual = hpMaximo;
        this.ataqueBase = ataqueBase;
        this.xpDrop = xpDrop;
        this.ouroDrop = ouroDrop;
        this.rank = this.calcularRank(nivel); //Assim que nascer, será calculado seu rank
    }
    // Classificação Top-Down
    calcularRank(nivel) {
        if (nivel >= 200) return "Monarca";
        if (nivel >=100) return "S";
        if (nivel >=76) return "A";
        if (nivel >=51) return "B";
        if (nivel >=26) return "C";
        if (nivel >=11) return "D";
        return "E";
    }

    // O monstro pode ter ações próprias no futuro
    receberDano(dano) {
        this.hpAtual -= dano;
        if (this.hpAtual < 0) this.hpAtual = 0;
    }
}
//Invocando monstros
//Regras da realidade para cada Rank de Portal
const regrasPortais = {
    "E": { minLvl: 1, MaxLvl: 10, nomes: ["Goblin", "Morcego da Caverna", "Slime"]},
    "D": { minLvl: 11, MaxLvl: 25, nomes: ["Orc Guerreiro", "Lobo das Sombras", "Zumbi"]},
    "C": { minLvl: 26, MaxLvl: 50, nomes: ["Lobo Alfa", "Golem de Pedra", "Vampiro Inferior"]},
    "B": { minLvl: 51, MaxLvl: 75, nomes: ["Cavaleiro Espectral", "Golem de Metal", "Vampiro Superior"]},
    "A": { minLvl: 76, MaxLvl: 100, nomes: ["Dragão Ancião", "Feiticeiro Sombrio", "Gigante de Ferro"]},
    "S": { minLvl: 101, MaxLvl: 200, nomes: ["Deus da Guerra", "Lorde dos Pesadelos", "Titã de Fogo"]},
};

//Construir o monstro baseado no portal
function abrirPortal(rankPortal) {
    let regras = regrasPortais[rankPortal];

    //Sorteia o nivel do monstro dentro da faixa do portal
    let nivelSorteado = Math.floor(Math.random() * (regras.MaxLvl - regras.minLvl + 1)) + regras.minLvl;

    //Escolhe um nome aleatório da lista do rank
    let nomeMonstro = regras.nomes[Math.floor(Math.random() * regras.nomes.length)];

    //Red Gate
    let mutacao = Math.random(); //sorteia entre 0.00 e 0.99
    let isPortalVermelho = mutacao <= 0.10;

    if (isPortalVermelho) {
        nivelSorteado += 15; //O nivel extrapola o limite
        nomeMonstro = "Elite Sanguinário " + nomeMonstro;
        alert("ALERTA DO SISTEMA: O Portal sofreu uma mutação! PORTAL VERMELHO DETECTADO!"); 
    }
    //Status escalam com o lvl
    //Red Gate os multiplicadores dobram
    let multiDificuldade = isPortalVermelho ? 2.5 : 1;

    let hpForjado = Math.floor((nivelSorteado * 25) + Math.pow(nivelSorteado, 1.25) * 15) * multiDificuldade;
    let atkForjado = Math.floor((nivelSorteado * 5) + Math.pow(nivelSorteado, 1.15) * 4) * multiDificuldade;
    let xpForjado = Math.floor(Math.pow(nivelSorteado, 1.5) * 30) * multiDificuldade;
    let ouroForjado = Math.floor(Math.pow(nivelSorteado, 1.3)* 15) * multiDificuldade;

    // Instancia a criatura no mundo
    monstroAtual = new Inimigo(nomeMonstro, nivelSorteado, hpForjado, atkForjado, xpForjado, ouroForjado);

    //Prepara o cenário
    emBatalha = true;
    document.getElementById('tela-masmorra').style.display = 'block';

    //Muda a cor do title se for red
    let tituloMasmorra = document.getElementById('titulo-masmorra');
    if (tituloMasmorra) {
        tituloMasmorra.innerText = isPortalVermelho ? "PORTAL VERMELHO" : `Masmorra Rank ${rankPortal}`; 
        tituloMasmorra.style.color = isPortalVermelho ? '#ef4444' : '#4ade80';
        tituloMasmorra.style.textShadow = isPortalVermelho ? '0 0 15px red' : '0 0 10px green';
    }

    registrarLog(`Um ${monstroAtual.nome} surgiu das sombbras!`);
    atualizarTelaMasmorra();
}

//Inicio vazio, vai ser definido ao entrar na masmorra
let monstroAtual = null;
let emBatalha = false;

//ENTIDADE DE ITENS
//Forma 1: Poção
class Pocao {
    constructor(nome, preco, curaHp) {
        this.nome = nome;
        this.preco = preco;
        this.curaHp = curaHp;
    }
    //A poção sabe qm curar
    usar(alvo) {
        alvo.hpAtual += this.curaHp;
        if (alvo.hpAtual > alvo.hpMaximo) alvo.hpAtual = alvo.hpMaximo;
        alert(`Você bebeu a [${this.nome}]. HP restaurado!`);
    }
}
//Forma 2: Armas
class Arma {
    constructor(nome, preco, bonusForca, bonusInteligencia, bonusAgilidade) {
        this.nome = nome;
        this.preco = preco;
        this.bonusForca = bonusForca;
        this.bonusInteligencia = bonusInteligencia;
        this.bonusAgilidade = bonusAgilidade;
        this.tipo = 'arma';
    }

    //Arma sabe como equipar e lidar com armas antigas
    usar(alvo) {
        //Se não existir gaveta de bonus, irei cira-la
        if (!alvo.atributosBonus) {
            alvo.atributosBonus = { forca: 0, inteligencia: 0, agilidade: 0, vitalidade: 0 };
        }

        //Se ja tem uma, guarda na bolsa e remove o bonus
        if (alvo.equipamentos.arma !== null) {
            let nomeArmaAntiga = alvo.equipamentos.arma;
            let armaAntigaObj = bancoDeItens[nomeArmaAntiga]; //puxa dado arma antiga

            alvo.inventario.push(nomeArmaAntiga); //guarda na bag

            if (armaAntigaObj) {
                alvo.atributosBonus.forca -= armaAntigaObj.bonusForca; //remove buff antigo
                alvo.atributosBonus.agilidade -= armaAntigaObj.bonusAgilidade;
                alvo.atributosBonus.inteligencia -= armaAntigaObj.bonusInteligencia; //msm coisa pra int
                
                //Impedir que os atributos bônus fiquem negativos
                if (alvo.atributosBonus.forca < 0) alvo.atributosBonus.forca = 0;
                if (alvo.atributosBonus.agilidade < 0) alvo.atributosBonus.agilidade = 0;
                if (alvo.atributosBonus.inteligencia < 0) alvo.atributosBonus.inteligencia = 0;
            }   
        }
        //Equipa a nova arma e aplica o bonus
        alvo.equipamentos.arma = this.nome;
        alvo.atributosBonus.forca += this.bonusForca;
        alvo.atributosBonus.agilidade += this.bonusAgilidade;
        alvo.atributosBonus.inteligencia += this.bonusInteligencia;

        alert (`[${this.nome}] equipada com sucesso! Força +${this.bonusForca}, Agilidade +${this.bonusAgilidade}, Inteligencia +${this.bonusInteligencia}`);
    }
}
//Forma 3: Habilidades
class Habilidade {
    constructor(nome, custoMana, multiplicador, efeitoDesc) {
        this.nome = nome;
        this.custoMana = custoMana;
        this.multiplicador = multiplicador; 
        this.efeitoDesc = efeitoDesc;
    }
}

//Forma 4: Armaduras
class Armadura {
    constructor(nome, preco, bonusVitalidade) {
        this.nome = nome;
        this.preco = preco;
        this.bonusVitalidade = bonusVitalidade;
    }

    usar(alvo) {
        if (!alvo.atributosBonus) alvo.atributoBonus = { forca: 0, inteligencia: 0, agilidade: 0, vitalidade: 0 };
        if (!alvo.equipamentos) alvo.equipamentos = { arma: null, armadura: null, acessorio: null };

        //Troca de armadura
        if (alvo.equipamentos.armadura !== null) {
            let itemAntigo = bancoDeItens[alvo.equipamentos.armadura];
            alvo.inventario.push(alvo.equipamentos.armadura);
            if (itemAntigo) alvo.atributosBonus.vitalidade -= itemAntigo.bonusVitalidade;
        }

        alvo.equipamentos.armadura = this.nome;
        alvo.atributosBonus.vitalidade += this.bonusVitalidade;

        //Recalcula HP máximo após mudar Vitalidade
        alvo.hpMaximo = 100 + ((alvo.atributos.vitalidade + alvo.atributosBonus.vitalidade) * 10);

        alert(`[${this.nome}] equipada! Vitalidade +${this.bonusVitalidade}.`);
    }
}
//Forma 5: Acessorio
class Acessorio {
    constructor(nome, preco, bonusAgi, bonusInt) {
        this.nome = nome;
        this.preco = preco;
        this.bonusAgilidade = bonusAgi;
        this.bonusInteligencia = bonusInt;
    }

    usar(alvo) {
        if (!alvo.atributosBonus) alvo.atributosBonus ={ forca: 0, inteligencia: 0, agilidade: 0, vitalidade: 0 };
        if (alvo.equipamentos.acessorio !== null) {
            let itemAntigo = bancoDeItens[alvo.equipamentos.acessorio];
            alvo.inventario.push(alvo.equipamentos.acessorio);
            if (itemAntigo) {
                alvo.atributosBonus.agilidade -= itemAntigo.bonusAgilidade;
                alvo.atributosBonus.inteligencia -= itemAntigo.bonusInteligencia;
            }
        }
        alvo.equipamentos.acessorio = this.nome;
        alvo.atributosBonus.agilidade += this.bonusAgilidade;
        alvo.atributosBonus.inteligencia += this.bonusInteligencia;

        alert (`${this.nome} equipado! Agilidade +${this.bonusAgilidade}, Inteligencia +${this.bonusInteligencia}.`);
    }
}
//Pra dar fuga
class MagiaFuga {
    constructor(nome, preco) {
        this.nome = nome;
        this.preco = preco;
    }

    usar(alvo) {
        alert(`Você rasgou o [${this.nome}]! A magia envolve seu corpo e você é teletransportado para fora da masmorra.`);
        fugirMasmorra();
        if (monstroAtual) monstroAtual.hpAtual = monstroAtual.hpMaximo; // Pra resetar o mob
        atualizarTelaMasmorra();
    }
}

//Cofre de itens
const bancoDeItens = {
    // Poções (Nome, Preço, Cura))
    "Poção de Cura (P)": new Pocao("Poção de Cura (P)", 30, 50),
    "Poção de Cura (M)": new Pocao("Poção de Cura (M)", 80, 150),
    "Poção de Cura (G)": new Pocao("Poção de Cura (G)", 200, 500),
    // Armas (Nome, Preço, Força, Inteligência, Agilidade)
    "Adaga Enferrujada": new Arma("Adaga Enferrujada", 100, 0, 0, 2),
    "Livro Antigo": new Arma("Livro Antigo", 150, 0, 5, 0),
    "Espada Longa do Cavaleiro": new Arma("Espada Longa do Cavaleiro", 350, 10, 0, 0),
    //Armaduras (Nome, Preço, Vitalidade)
    "Armadura de Couro": new Armadura("Armadura de Couro", 150, 5),
    "Armadura de Ferro": new Armadura("Armadura de Ferro", 500, 15),
    //Acessorios (Nome, Preço, Bônus Agi, Bônus Int)
    "Anel da Agilidade": new Acessorio("Anel da Agilidade", 120, 3, 0),
    "Colar do Sábio": new Acessorio("Colar do Sábio", 200, 0, 8),
    //Magias (Nome, Preço)
    "Pergaminho de Fuga": new MagiaFuga("Pergaminho de Fuga", 200)
};

//Cofre de habilidades
const grimorio = {
    "Seta de Mana": new Habilidade("Seta de Mana", 15, 1.8, "Dano mágico focado."),
    "Explosão Arcana": new Habilidade("Explosão Arcana", 40, 3.5, "Dano massivo, mas gasta muita mana."),
    "Dreno de Vida": new Habilidade("Dreno de Vida", 25, 1.2, "Causa dano e cura um pouco de HP.")
};
//Cofre conquistas
const bancoConquistas = {
    // COMBATE
    "ACH_EXTERMINADOR": { nome: "Exterminador de Pragas", req: () => conquistas.monstrosAbatidos >= 50, bonus: { forca: 5 }, desc: "Abater 50 Monstros" },
    "ACH_ELITE": { nome: "Carrasco de Elites", req: () => conquistas.elitesAbatidos >= 10, bonus: { agilidade: 10 }, desc: "Abater 10 Elites Sanguinários" },
    "ACH_SOBERANO": { nome: "Soberano da Masmorra", req: () => conquistas.monstrosAbatidos >= 500, bonus: { forca: 15, agilidade: 15, inteligencia: 15, vitalidade: 15 }, desc: "Abater 500 Monstros Totais" },
    
    // PROSPERIDADE
    "ACH_MAOS_OURO": { nome: "Mãos de Ouro", req: () => imperador.ouro >= 5000, bonus: { inteligencia: 5 }, desc: "Acumular 5.000 de Ouro" },
    "ACH_CAPITALISTA": { nome: "Capitalista Arcano", req: () => conquistas.ouroGasto >= 10000, bonus: { ouroMult: 0.1 }, desc: "Gastar 10.000 Ouro na Loja" },
    "ACH_VIRTUOSO": { nome: "O Virtuoso", req: () => imperador.missoesConcluidas.filter(m => m.includes("REAL")).length >= 5, bonus: { vitalidade: 20 }, desc: "Resgatar 5 Recompensas Reais" },
    
    // DISCIPLINA
    "ACH_MENTE_INABALAVEL": { nome: "Mente Inabalável", req: () => conquistas.meditacoesTotais >= 50, bonus: { mpRegen: 2 }, desc: "Meditar 50 vezes" },
    "ACH_ESFORCO": { nome: "Esforço Incansável", req: () => conquistas.repetiveisTotais >= 100, bonus: { vitalidade: 10 }, desc: "Concluir 100 Treinos Repetíveis" },
    "ACH_ERUDITO": { nome: "Erudito das Sombras", req: () => imperador.atributos.inteligencia >= 20, bonus: { danoMagicoMult: 0.15 }, desc: "Alcançar 20 de Inteligência Base" },
    
    // SUPREMA
    "ACH_MONARCA_DESPERTO": { nome: "O Despertar do Monarca", req: () => imperador.nivel >= 50, bonus: { todos: 25 }, desc: "Alcançar Nível 50" }
};

//Abrir portais
function entrarMasmorra() {
    //Escolhe um indice aleatório do bestiário
    let indiceAleatorio = Math.floor(Math.random() * bestiario.length);
    //Clono o monstro da lista para que o original não fique com hp baixo da próxima vez
    let modelo = bestiario[indiceAleatorio];
    monstroAtual = new Inimigo(modelo.nome, modelo.nivel, modelo.hpMaximo, modelo.ataqueBase, modelo.xpDrop, modelo.ouroDrop);

    document.getElementById('tela-masmorra').style.display = 'block';
    document.getElementById('log-batalha').innerText = `Um ${monstroAtual.nome} Rank ${monstroAtual.nivel} apareceu!`;

    atualizarTelaMasmorra(); 
}

//Logica batalhas
function registrarLog(mensagem) {
    document.getElementById('log-batalha').innerText = mensagem;
}

function atualizarTelaMasmorra(){
    //Atualizar o status do monstro na tela da masmorra
    let nomeMonstroEl = document.getElementById('monstro-nome');
    let nivelMonstroEl = document.getElementById('monstro-nivel');

    if (nomeMonstroEl) nomeMonstroEl.innerText = monstroAtual.nome;
    if (nivelMonstroEl) {
        nivelMonstroEl.innerText = `${monstroAtual.rank} (Nvl ${monstroAtual.nivel})`;
    }

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
    let mpTextoBatalha = document.getElementById('batalha-player-mp-texto');
    let mpBarraBatalha = document.getElementById('batalha-player-mp-bar');

    if (mpTextoBatalha && mpBarraBatalha) {
        mpTextoBatalha.innerText = `${imperador.mpAtual}/${imperador.mpMaximo}`;
        let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
        mpBarraBatalha.style.width = porcentagemMP + '%';
    }
    emBatalha = true;
}

/**
 * Realiza o ciclo de combate por turnos entre o Jogador e o Monstro.
 * Implementa assincronicidade para simular o tempo de resposta da IA.
 */
function atacarMonstro() {
    let forcaTotal = imperador.atributos.forca + (imperador.atributosBonus ? imperador.atributosBonus.forca : 0);
    let agiTotal = imperador.atributos.agilidade + (imperador.atributosBonus ? imperador.atributosBonus.agilidade : 0);
    let intTotal = imperador.atributos.inteligencia + imperador.atributosBonus.inteligencia;
    let chanceCritico = Math.min(agiTotal * 1.5, 100);
    let isCrit = (Math.random() * 100) < chanceCritico;
    let danoFinal = 0;
    let armaEquipada = bancoDeItens[imperador.equipamentos.arma];
    if (armaEquipada && armaEquipada.bonusInteligencia > 0) {
        // Dano Mágico
        danoFinal = Math.floor(Math.random() * 10) + intTotal;
        console.log("Ataque Mágico desferido!");
    } else {
        // Dano Físico
        danoFinal =isCrit ? (forcaTotal * 4) : (forcaTotal * 2);
        console.log("Ataque Físico desferido!");
    }
    monstroAtual.receberDano(danoFinal);
    
    // O Log de Batalha agora narra o acerto crítico
    if (isCrit) {
        registrarLog(` CRÍTICO! Você se moveu como um vulto e causou ${danoFinal} de dano!`);
    } else {
        registrarLog(`Você atacou com precisão e causou ${danoFinal} de dano!`);
    }
    
    atualizarTelaMasmorra();

    if (monstroAtual.hpAtual <= 0) {
        registrarLog(`O ${monstroAtual.nome} foi abatido! Você adquiriu +${monstroAtual.xpDrop} XP e +${monstroAtual.ouroDrop} Ouro.`);
        imperador.xp += monstroAtual.xpDrop;
        imperador.ouro += monstroAtual.ouroDrop;
        progredirConquista('monstros', 1); // Registra o abate
        atualizarVisualElite(); // Atualiza a barra roxa imediatamente
        if (imperador.xp >= imperador.xpNecessario) {
            imperador.subirDeNivel();
            alert(`Parabéns, Imperador! Você subiu para o nível ${imperador.nivel}! O Sistema reconhece o seu crescimento.`);
        }

        imperador.salvarEstado();
        atualizarTela();
        
        setTimeout(() => {
            fugirMasmorra();
            monstroAtual.hpAtual = monstroAtual.hpMaximo; 
            atualizarTelaMasmorra();
        }, 2000);
        return; 
    }
    
    turnoDoMonstro();
}

function conjurarHabilidade(nomeHabilidade) {
    let habilidade = grimorio[nomeHabilidade];
    let intTotal = imperador.atributos.inteligencia + (imperador.atributosBonus.inteligencia || 0);

    if (imperador.mpAtual < habilidade.custoMana) {
        registrarLog(" Mana insuficiente para conjurar " + habilidade.nome + "!");
        return;
    }

    imperador.mpAtual -= habilidade.custoMana;
    let danoMagico = Math.floor(intTotal * habilidade.multiplicador) + Math.floor(Math.random() * 5);
    monstroAtual.receberDano(danoMagico);
    
    // Efeito Especial (Ex: Dreno de Vida)
    if (nomeHabilidade === "Dreno de Vida") {
        let cura = Math.floor(danoMagico * 0.3);
        imperador.hpAtual = Math.min(imperador.hpAtual + cura, imperador.hpMaximo);
        registrarLog(` Você drenou ${cura} de vida do inimigo!`);
    }

    registrarLog(` [${habilidade.nome}] causou ${danoMagico} de dano arcano!`);
    
    atualizarTelaMasmorra();
    if (monstroAtual.hp > 0) {
        setTimeout(turnoDoMonstro, 1000); 
    }
}

function turnoDoMonstro() {
    if (!emBatalha || monstroAtual.hpAtual <= 0) return;

    setTimeout(() => {
        let agiTotal = imperador.atributos.agilidade + (imperador.atributosBonus ? imperador.atributosBonus.agilidade : 0);
        //  AGILIDADE: Chance de Esquiva (Máximo travado em 50% para o jogo não ficar fácil demais)
        let chanceEsquiva = Math.min(agiTotal * 1.2, 50);
        let isEsquiva = (Math.random() * 100) < chanceEsquiva;

        if (isEsquiva) {
            registrarLog(` ESQUIVA! O inimigo atacou o vazio. Seus reflexos são absolutos!`);
        } else {
            let danoMonstro = monstroAtual.ataqueBase;
            imperador.hpAtual -= danoMonstro;
            if (imperador.hpAtual < 0) imperador.hpAtual = 0;
            registrarLog(` O ${monstroAtual.nome} revidou furiosamente e causou ${danoMonstro} de dano!`);
        }
      
        atualizarTela(); 
        atualizarTelaMasmorra(); 
        imperador.salvarEstado();

        if (imperador.hpAtual <= 0) {
            registrarLog(`A sua visão escurece . . . Você foi abatido.`);
            alert("O Sistema ativou a proteção e te salvou com 1 de HP!");
            imperador.hpAtual = 1;
            imperador.salvarEstado();
            atualizarTela();
            fugirMasmorra();
            monstroAtual.hpAtual = monstroAtual.hpMaximo; 
            atualizarTelaMasmorra();
        }
    }, 1000);
}

 //Abra a bolsa na batalha
 function abrirBolsaBatalha() {
    let divBolsa = document.getElementById('bolsa-batalha');
    let grade = document.getElementById('grade-bolsa-batalha');

    //Toggle exibi...
    if (divBolsa.style.display === 'block') {
        divBolsa.style.display = 'none';
        return;
    }
    divBolsa.style.display = 'block';
    grade.innerHTML = '';

    //Procura poções e magia na bolsa
    let itensUteis = imperador.inventario.filter(nomeItem => {
        let obj = bancoDeItens[nomeItem];
        return obj instanceof Pocao || obj instanceof MagiaFuga;
    });

    if (itensUteis.length === 0) {
        grade.innerHTML = '<p style="color: #777;">Nenhum item consumível disponível.</p>';
        return;
    }

    // Cria os botões para usar os itens na hora
    for (let item of itensUteis) {
        let btn = document.createElement('button');
        btn.className = 'btn-complete';
        btn.style.padding = '5px 10px';
        btn.style.fontSize = '0.9em';
        btn.innerText = `Usar ${item}`;
        
        btn.onclick = function() {
            divBolsa.style.display = 'none'; // Esconde a bolsa ao usar
            usarItem(item); // Usa o item
        };
        grade.appendChild(btn);
    }
}

function fugirMasmorra() {
    document.getElementById('tela-masmorra').style.display = 'none';
    emBatalha = false;
}

// Função para gerar o Hash de integridade
async function gerarLacre(dados) {
    const chaveSecreta = "SENHA_ULTRA_SECRETA_DO_IMPERADOR"; // Nunca revele isso '-'
    const mensagem = String(dados.nivel) + String(dados.ouro) + String(dados.xp) + chaveSecreta;
    const encoder = new TextEncoder();
    const data = encoder.encode(mensagem);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// MOTOR DE IGNIÇÃO BLINDADO
async function carregarMundo() {
    try {
        let resposta = await fetch('http://127.0.0.1:5000/carregar');
        let dadosBanco = await resposta.json();
        
        if (dadosBanco && Object.keys(dadosBanco).length > 0) {
            console.log(" Resgatando do Monólito SQLite (Nvl " + dadosBanco.nivel + ").");
            imperador = new Monarca(dadosBanco.nome);
            Object.assign(imperador, dadosBanco);
        } else {
            console.log(" Um novo Monarca surge.");
            imperador = new Monarca("Thawan Oliveira");
        }
    } catch (erro) {
        console.warn(" Servidor Python offline. Inicializando vazio.");
        imperador = new Monarca("Thawan Oliveira");
    }

    //  A MAGIA DO TEMPO 
    let dataAtual = new Date().toLocaleDateString();
    if (imperador.ultimoAcesso !== dataAtual) {
        console.log(`Novo dia detectado! Missões resetadas, ${imperador.titulo}!`);
        imperador.missoesConcluidas = [];
        imperador.ultimoAcesso = dataAtual;
        imperador.hpAtual = imperador.hpMaximo;
        imperador.mpAtual = imperador.mpMaximo;
        imperador.salvarEstado(); 
    }

    atualizarTela();
    renderizarInventario();
}

carregarMundo();