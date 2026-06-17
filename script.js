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
    this.equipamentos = {
      arma: null,
      escudo: null,
      armadura: null,
      acessorio: null,
    };
    this.atributosBonus = {
      forca: 0,
      inteligencia: 0,
      agilidade: 0,
      vitalidade: 0,
    };
    this.missoesConcluidas = [];
    this.ultimoAcesso = "";
  }

  async salvarEstado() {
    try {
      const lacre = await gerarLacre(this);
      const forcaSalvar = this.statusReal
        ? this.statusReal.forca
        : this.atributos.forca;
      const agiSalvar = this.statusReal
        ? this.statusReal.agilidade
        : this.atributos.agilidade;
      const intSalvar = this.statusReal
        ? this.statusReal.inteligencia
        : this.atributos.inteligencia;
      const vitSalvar = this.statusReal
        ? this.statusReal.vitalidade
        : this.atributos.vitalidade;

      const dadosParaSalvar = {
        nome: this.nome,
        nivel: this.nivel,
        xp: this.xp,
        ouro: this.ouro,
        forca: forcaSalvar,
        agilidade: agiSalvar,
        inteligencia: intSalvar,
        vitalidade: vitSalvar,
        inventario: this.inventario,
      };
      const seloImperial = localStorage.getItem("selo_imperial");
      const resposta = await fetch("http://localhost:5000/salvar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lacre-Integridade": lacre,
          Authorization: `Bearer ${seloImperial}`,
        },
        body: JSON.stringify(dadosParaSalvar),
      });

      if (resposta.ok) {
        console.log("Sincronização com o Monólito concluída!");
        localStorage.setItem("memoria_imperador", JSON.stringify(this));
      }
    } catch (erro) {
      console.error("Falha na conexão com o servidor:", erro);
      localStorage.setItem("save_imperador", JSON.stringify(this));
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
    this.hpMaximo = 100 + this.atributos.vitalidade * 10;
    this.mpMaximo = 50 + this.atributos.inteligencia * 5;
    this.hpAtual = this.hpMaximo;
    this.mpAtual = this.mpMaximo;
    adicionarProgressoConquista("monarca_supremo", 1);
    if (this.atributos.inteligencia >= 20) {
      adicionarProgressoConquista("erudito_sombras", 20);
    }
    this.salvarEstado();
  }
}

// --- O DESPERTAR AUTOMÁTICO DO IMPERADOR ---
window.addEventListener("load", () => {
  const usuarioSalvo = localStorage.getItem("usuario_shadow");
  const overlay = document.getElementById("login-overlay");
  atualizarBotaoMeditacao();
  if (usuarioSalvo) {
    imperador.nome = usuarioSalvo;
    console.log("Sessão restaurada para:", usuarioSalvo);
    if (overlay) {
      overlay.style.display = "none";
    }
    atualizarTela();
  } else {
    console.log("Nenhum usuario encontrado...");
    if (overlay) {
      overlay.style.display = "flex";
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
  const user = document.getElementById("login-user").value;
  const pass = document.getElementById("login-pass").value;

  try {
    const resposta = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, senha: pass }),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      document.getElementById("login-overlay").style.display = "none";

      imperador.nome = resultado.dados.username;
      imperador.ouro = resultado.dados.ouro;
      imperador.nivel = resultado.dados.nivel;
      imperador.xp = resultado.dados.xp;
      imperador.hash_seguranca = resultado.dados.hash;
      imperador.inventario = resultado.dados.inventario || [];
      verificarStatusPunicao(resultado.dados);
      localStorage.setItem("usuario_shadow", resultado.dados.username);
      console.log("Login confirmado para:", imperador.nome);
      atualizarTela();
    } else {
      alert(resultado.mensagem);
    }
  } catch (erro) {
    console.error("Erro no portal de login:", erro);
  }
}

// 1. O Feitiço da Visão (Revela e Oculta a Senha)
function alternarVisaoSenha(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); // Muda o ícone para um olho cortado
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// 2. Cadastro 
async function cadastrarNoReino() {
    const usuario = document.getElementById("reg-user").value.trim();
    const senha = document.getElementById("reg-pass").value;
    const confirmaSenha = document.getElementById("reg-confirm-pass").value;

    if (!usuario || !senha) {
        alert("O Império exige um nome e uma senha!");
        return;
    }

    if (senha !== confirmaSenha) {
        alert("As senhas não coincidem, Imperador. Verifique e tente novamente.");
        return;
    }

    try {
        const resposta = await fetch("http://localhost:5000/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usuario, senha: senha })
        });

        if (resposta.ok) {
            alert(" Império Fundado com Sucesso! Volte e faça o login.");
            
            // Limpa os campos após o sucesso
            document.getElementById("reg-user").value = "";
            document.getElementById("reg-pass").value = "";
            document.getElementById("reg-confirm-pass").value = "";
            
            // Troca a tela de volta para o Login (se você tiver essa função)
            if (typeof alternarModo === "function") alternarModo(); 
        } else {
            const erroData = await resposta.json();
            alert("Falha na Forja: " + (erroData.mensagem || "Erro desconhecido."));
        }
    } catch (erro) {
        console.error("A conexão com o Monólito falhou:", erro);
        alert("O servidor do Sistema está inacessível. O Monólito está ligado?");
    }
}
// 1. Alterna entre a tela de Login e a de Registro
function alternarModo(isRegistro) {
    const login = document.getElementById("sessao-login");
    const cadastro = document.getElementById("sessao-cadastro");
    const titulo = document.getElementById("titulo-portal");

    if (isRegistro) {
        login.style.display = "none";
        cadastro.style.display = "block";
        titulo.innerText = "Novo Despertar";
        titulo.style.color = "#b366ff";
    } else {
        login.style.display = "block";
        cadastro.style.display = "none";
        titulo.innerText = "Shadow System";
        titulo.style.color = "#4a90e2";
    }
}

async function renderizarMural() {
  const mural = document.getElementById("mural-conquistas");
  if (!mural) return;

  try {
    const resposta = await fetch("http://localhost:5000/carregar_conquistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: imperador.nome }),
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      mural.innerHTML = "";

      if (dados.conquistas.length === 0) {
        mural.innerHTML =
          '<p style="color: #888; text-align: center; font-size: 0.8rem;">O histórico de batalhas está vazio.</p>';
        return;
      }

      dados.conquistas.forEach((conq) => {
        const card = document.createElement("div");
        card.style.cssText = "margin-bottom: 20px;";

        let descricao =
          descricoesConquistas[conq.codigo] || "Requisito oculto pelo Sistema.";
        card.title = descricao;

        let porcentagem = (conq.progresso / conq.objetivo) * 100;
        if (porcentagem > 100) porcentagem = 100;
        let corBarra = conq.concluida ? "#b366ff" : "#4a2377";

        card.innerHTML = `
                    <h4 style="color: #b366ff; text-align: center; text-transform: uppercase; margin-bottom: 5px; text-shadow: 0 0 5px #b366ff;">
                        CONQUISTA: ${conq.nome_visual}
                    </h4>
                    <div style="width: 100%; background: #1a1a1a; border: 1px solid #333; border-radius: 5px; height: 10px; margin: 10px 0;">
                        <div style="width: ${porcentagem}%; background: ${corBarra}; height: 100%; border-radius: 5px; box-shadow: 0 0 8px ${corBarra}; transition: width 0.5s;"></div>
                    </div>
                    <p style="text-align: center; font-size: 0.7rem; color: #aaa; margin: 0;">
                        ${conq.progresso} / ${conq.objetivo}
                    </p>
                `;

        mural.appendChild(card);
      });
    }
  } catch (erro) {
    console.error("Falha ao consultar o Monólito das Conquistas:", erro);
  }
}

imperador.titulosDesbloqueados = ["Iniciante"];
imperador.tituloEquipado = "Iniciante";

async function carregarLojaDoBanco() {
  try {
    const resposta = await fetch('http://localhost:5000/loja');
    if (!resposta.ok) throw new Error("Falha ao buscar itens da loja");

    const itensLoja = await resposta.json();
    console.log(" Itens da loja carregados do Monólito:", itensLoja);

    renderizarLoja(itensLoja);
  } catch (erro) {
    console.error("Falha ao carregar o Mercado das Sombras:", erro);
  }
}

async function comprarNoBanco(idItem, precoDinamico) {
  const nomeUsuario = imperador.nome || localStorage.getItem("usuario_shadow");
  if (!nomeUsuario) {
    alert("Erro: Usuario nao identificado.");
    return;
  }
  if (!idItem) {
    console.error("Erro: idItem nao foi passado para a funcao.");
    return;
  }
  const seloImperial = localStorage.getItem("selo_imperial");
  try {
    let resposta = await fetch("http://localhost:5000/comprar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seloImperial}`,
      },
      body: JSON.stringify({
        id_item: parseInt(idItem),
        preco_dinamico: precoDinamico,
      }),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      imperador.ouro = resultado.novo_ouro;
      imperador.hash_seguranca = resultado.novo_hash;
      imperador.inventario.push(resultado.item_nome);

      await imperador.salvarEstado();
      renderizarInventario();
      adicionarProgressoConquista("capitalista_arcano", precoDinamico);
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
  const container = document.getElementById("loja-virtual");
  if (!container) return;
  container.innerHTML = "";

  itens.forEach((item) => {
    // Log
    console.log("Processando item da loja:", item);
    const div = document.createElement("div");
    div.className = "quest-card";

    const idReal = item.id !== undefined ? item.id : item[0];
    const precoBase = item.preco || item[2];

    // Calcula o novo preço baseado no Dólar
    const precoDinamico = Math.ceil(precoBase * window.multiplicadorDolar);
    // Se estiver caro (dólar alto), fica Vermelho. Se estiver barato, Azul. Normal é Amarelo.
    let corPreco =
      window.multiplicadorDolar > 1.0
        ? "#ff4d4d"
        : window.multiplicadorDolar < 1.0
          ? "#00b3ff"
          : "#ffd700";

    div.innerHTML = `
            <div class="quest-info">
                <h3>${item.nome || item[1]}</h3>
                <p>${item.descricao || item[3]} <br>Custo: <span style="color: ${corPreco}; font-weight: bold;">${precoDinamico} Ouro</span></p>
            </div>
            <button type="button" class="btn-complete" onclick="comprarNoBanco(${idReal}, ${precoDinamico})">
                Comprar
            </button>
        `;
    container.appendChild(div);
  });
}

function tentarDespertar() {
    const custoFragmentos = 10; 
    const novaClasse = "Jogador"; 

    //  Verifica se o Imperador já está na classe máxima
    if (imperador.titulo === novaClasse) {
        alert(" Você já atingiu o ápice desta evolução!");
        return;
    }

    //  Conta quantos Fragmentos de Sombra existem no inventário
    let qtdFragmentos = imperador.inventario.filter(
        item => (typeof item === "string" ? item : item.nome) === "Fragmento de Sombra"
    ).length;

    if (qtdFragmentos >= custoFragmentos) {
        // A) Consome os fragmentos
        for (let i = 0; i < custoFragmentos; i++) {
            let index = imperador.inventario.findIndex(
                item => (typeof item === "string" ? item : item.nome) === "Fragmento de Sombra"
            );
            if (index !== -1) imperador.inventario.splice(index, 1);
        }

        // B) A Explosão de Poder (Bônus Massivo de Despertar)
        imperador.titulo = novaClasse;
        imperador.atributos.forca += 15;
        imperador.atributos.agilidade += 15;
        imperador.atributos.inteligencia += 10;
        imperador.atributos.vitalidade += 10;
        
        imperador.hpMaximo += 200; 
        imperador.mpMaximo += 100; 
        imperador.hpAtual = imperador.hpMaximo; 
        imperador.mpAtual = imperador.mpMaximo;

        alert(` DESPERTAR CONCLUÍDO! \n\nAs sombras se curvam perante você. Seu título agora é [${novaClasse}]!\nSeus atributos base explodiram e seu corpo foi totalmente restaurado!`);

        imperador.salvarEstado();
        atualizarTela();
    } else {
        alert(` Fragmentos Insuficientes...\nVocê possui ${qtdFragmentos}/${custoFragmentos} Fragmentos de Sombra.`);
    }
}

function atualizarTela() {
  document.getElementById("player-nome").innerText = imperador.nome;

  const displayTitulo = document.getElementById("player-titulo");
  if (displayTitulo) {
    displayTitulo.innerText = (
      imperador.tituloEquipado || "O mais fraco"
    ).toUpperCase();
  }
  document.getElementById("player-level").innerText = imperador.nivel;
  document.getElementById("player-ouro").innerText = imperador.ouro;
  document.getElementById("xp-text").innerText =
    `XP: ${imperador.xp}/${imperador.xpNecessario}`;

  // BÔNUS DO TÍTULO
  let tituloBonus = { forca: 0, agilidade: 0, inteligencia: 0, vitalidade: 0 };
  imperador.bonusOuro = 0;
  imperador.bonusCritico = 0;
  imperador.bonusMpRegen = 0;
  imperador.bonusDanoMagicoMult = 0;
  // Verifica se tem título equipado e se ele possui um 'buff'
  if (
    imperador.tituloEquipado &&
    bancoTitulos[imperador.tituloEquipado] &&
    bancoTitulos[imperador.tituloEquipado].buff
  ) {
    let buffDoTitulo = bancoTitulos[imperador.tituloEquipado].buff;

    //  Se o buff for 'todos' aplica a tudo!
    if (buffDoTitulo.todos) {
      tituloBonus.forca = buffDoTitulo.todos;
      tituloBonus.agilidade = buffDoTitulo.todos;
      tituloBonus.inteligencia = buffDoTitulo.todos;
      tituloBonus.vitalidade = buffDoTitulo.todos;
    } else {
      // Se for atributo específico (Ex: Exterminador, Colosso), aplica individualmente
      tituloBonus.forca = buffDoTitulo.forca || 0;
      tituloBonus.agilidade = buffDoTitulo.agilidade || 0;
      tituloBonus.inteligencia = buffDoTitulo.inteligencia || 0;
      tituloBonus.vitalidade = buffDoTitulo.vitalidade || 0;
    }
    // Multi especiais
    if (buffDoTitulo.ouroMult) imperador.bonusOuro = buffDoTitulo.ouroMult;
    if (buffDoTitulo.critico) imperador.bonusCritico = buffDoTitulo.critico;
    if (buffDoTitulo.mpRegen) imperador.bonusMpRegen = buffDoTitulo.mpRegen;
    if (buffDoTitulo.danoMagicoMult)
      imperador.bonusDanoMagicoMult = buffDoTitulo.danoMagicoMult;
  }

  //  A SOMA DO PODER
  let forcaTotal =
    imperador.atributos.forca +
    imperador.atributosBonus.forca +
    tituloBonus.forca;
  let intTotal =
    imperador.atributos.inteligencia +
    imperador.atributosBonus.inteligencia +
    tituloBonus.inteligencia;
  let agiTotal =
    imperador.atributos.agilidade +
    imperador.atributosBonus.agilidade +
    tituloBonus.agilidade;
  let vitTotal =
    imperador.atributos.vitalidade +
    imperador.atributosBonus.vitalidade +
    tituloBonus.vitalidade;

    // Fórmulas de RPG:
// Crítico: Base 5% + (0.5% para cada ponto de Agilidade)
let chanceCritico = 5 + (agiTotal * 0.5); 

// Esquiva: Base 2% + (1% para cada ponto de Agilidade)
let chanceEsquiva = 2 + (agiTotal * 1.0);

  //  Status Derivados
  imperador.hpMaximo = 100 + vitTotal * 10;
  imperador.mpMaximo = 50 + intTotal * 5;

  if (imperador.hpAtual > imperador.hpMaximo)
    imperador.hpAtual = imperador.hpMaximo;
  if (imperador.mpAtual > imperador.mpMaximo)
    imperador.mpAtual = imperador.mpMaximo;

  document.getElementById("attr-forca").innerText = forcaTotal;
  document.getElementById("attr-inteligencia").innerText = intTotal;
  document.getElementById("attr-agilidade").innerText = agiTotal;
  document.getElementById("attr-vitalidade").innerText = vitTotal;
  // Exemplo de cálculo de Status Secundários dentro da sua função atualizarTela():

// Escrevendo na tela:
document.getElementById('status-critico').innerText = `${chanceCritico.toFixed(1)}%`;
document.getElementById('status-esquiva').innerText = `${chanceEsquiva.toFixed(1)}%`;
document.getElementById('status-poder-fisico').innerText = `${forcaTotal}`; // Pode somar o ataque da arma aqui

  // Lógica equipamentos
  let estiloBtn = `class="btn-complete" style="padding: 0px 5px; font-size: 0.8em; margin-left: 5px; cursor: pointer;"`;

  document.getElementById("slot-arma").innerHTML = imperador.equipamentos.arma
    ? `${imperador.equipamentos.arma} <button onclick="desequiparItem('arma')" ${estiloBtn}>X</button>`
    : "Nenhuma";

  document.getElementById("slot-escudo").innerHTML = imperador.equipamentos
    .escudo
    ? `${imperador.equipamentos.escudo} <button onclick="desequiparItem('escudo')" ${estiloBtn}>X</button>`
    : "Nenhum";

  document.getElementById("slot-armadura").innerHTML = imperador.equipamentos
    .armadura
    ? `${imperador.equipamentos.armadura} <button onclick="desequiparItem('armadura')" ${estiloBtn}>X</button>`
    : "Nenhuma";

  document.getElementById("slot-acessorio").innerHTML = imperador.equipamentos
    .acessorio
    ? `${imperador.equipamentos.acessorio} <button onclick="desequiparItem('acessorio')" ${estiloBtn}>X</button>`
    : "Nenhum";

  let porcentagemXP = (imperador.xp / imperador.xpNecessario) * 100;
  document.getElementById("xp-bar").style.width = porcentagemXP + "%";

  for (let missao of imperador.missoesConcluidas) {
    let botaoSalvo = document.getElementById("btn-" + missao);

    if (botaoSalvo) {
      botaoSalvo.innerText = "Concluída";
      botaoSalvo.disabled = true;
      botaoSalvo.style.color = "#555";
      botaoSalvo.style.borderColor = "#555";
      botaoSalvo.style.boxShadow = "none";
      botaoSalvo.style.cursor = "not-allowed";
    }
  }

  document.getElementById("player-hp").innerText =
    `${imperador.hpAtual}/${imperador.hpMaximo}`;
  document.getElementById("player-mp").innerText =
    `${imperador.mpAtual}/${imperador.mpMaximo}`;

  let porcentagemHP = (imperador.hpAtual / imperador.hpMaximo) * 100;
  document.getElementById("hp-bar").style.width = porcentagemHP + "%";

  let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
  document.getElementById("mp-bar").style.width = porcentagemMP + "%";
}

function verificarConquistas() {
  let houveConquista = false;

  for (let id in bancoConquistas) {
    let conquista = bancoConquistas[id];

    // Se o Imperador atingiu o requisito e ainda não tem a medalha
    if (conquista.req() && !imperador.missoesConcluidas.includes(id)) {
      if (
        conquista.titulo &&
        !imperador.titulosDesbloqueados.includes(conquista.titulo)
      ) {
        imperador.titulosDesbloqueados.push(conquista.titulo);
        registrarLog(` Novo Título Desbloqueado: ${conquista.titulo}`);
      }
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
      registrarLog(` CONQUISTA ALCANÇADA: [${conquista.nome}]!`);
      alert(` CONQUISTA LENDÁRIA!\n${conquista.nome}: ${conquista.desc}`);
      houveConquista = true;
    }
  }
  if (houveConquista) {
    imperador.salvarEstado();
    atualizarTela();
  }
}

function alternarBotoesCombate(ligar) {
  const botoes = document.querySelectorAll(
    '.skills-container button, button[onclick="atacarMonstro()"], button[onclick="abrirBolsaBatalha()"]',
  );

  botoes.forEach((btn) => {
    btn.disabled = !ligar;
    btn.style.opacity = ligar ? "1" : "0.5";
    btn.style.cursor = ligar ? "pointer" : "not-allowed";
  });
}

function meditar() {
  if (emBatalha) {
    alert("Você não pode meditar em combate!");
    return;
  }

  let agora = new Date().getTime();
  let ultimoDescanso = localStorage.getItem("tempo_meditacao") || 0;
  let tempoEspera = 5 * 60 * 1000; // 5 minutos em milisegundos

  if (agora - ultimoDescanso < tempoEspera) {
    // Se ainda está em cooldown, não faz nada
    return;
  }

  if (
    imperador.hpAtual >= imperador.hpMaximo &&
    imperador.mpAtual >= imperador.mpMaximo
  ) {
    alert("Sua energia já está plena.");
    return;
  }

  // Lógica de Cura
  let curaHp = Math.floor(imperador.hpMaximo * 0.3);
  let curaMp = Math.floor(imperador.mpMaximo * 0.3);
  imperador.hpAtual = Math.min(imperador.hpAtual + curaHp, imperador.hpMaximo);
  imperador.mpAtual = Math.min(imperador.mpAtual + curaMp, imperador.mpMaximo);

  localStorage.setItem("tempo_meditacao", agora);
  imperador.salvarEstado();
  adicionarProgressoConquista("mente_inabalavel", 1);
  atualizarTela();

  atualizarBotaoMeditacao();
  alert(` Meditação concluída! +${curaHp} HP e +${curaMp} MP.`);
}

function atualizarBotaoMeditacao() {
  const btn = document.getElementById("btn-meditar");
  if (!btn) return;

  const tempoEspera = 5 * 60 * 1000;

  const intervalo = setInterval(() => {
    let agora = new Date().getTime();
    let ultimoDescanso = localStorage.getItem("tempo_meditacao") || 0;
    let tempoPassado = agora - ultimoDescanso;
    let restante = tempoEspera - (agora - ultimoDescanso);

    if (restante > 0) {
      // Calcula minutos e segundos
      let min = Math.floor(restante / 60000);
      let seg = Math.floor((restante % 60000) / 1000);

      btn.innerText = `Aguarde: ${min}:${seg < 10 ? "0" : ""}${seg}`;
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
  adicionarProgressoConquista("esforco_incansavel", 1);
  atualizarTela();
  imperador.salvarEstado();
}

//  MISSÕES DINÂMICAS
async function completarMissaoDinamica(id, atributo) {
    // 1. Localiza a missão na memória do Imperador
    const missaoIndex = (imperador.missoesAtivas || []).findIndex((m) => m.id === id);
    if (missaoIndex === -1) return;
    const missao = imperador.missoesAtivas[missaoIndex];

    if (missao.concluida) return; // Evita resgate duplo

    const nivelAtual = imperador.nivel || 1;
    let multiplicador = Math.max(1, Math.floor(Math.pow(nivelAtual, 1.2)));
    let xpFinal = missao.xp * multiplicador;
    let ouroFinal = missao.ouro * multiplicador;

    try {
        const resposta = await fetch("http://localhost:5000/completar_missao_dinamica", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: id,
                username: imperador.nome,
                xp: xpFinal,
                ouro: ouroFinal,
                atributo: atributo,
            }),
        });

        if (resposta.ok) {
            alert(`Missão Cumprida!\n+${xpFinal} XP | +${ouroFinal} Ouro\nAtributo Melhorado: ${atributo}`);

            // 2. Atualiza a Essência do Monarca
            imperador.xp += xpFinal;
            imperador.ouro += ouroFinal;

            const mapa = {"Força": "forca", "Agilidade": "agilidade", "Inteligência": "inteligencia", "Vitalidade": "vitalidade"};
            const attrKey = mapa[atributo];
            if (attrKey && imperador.atributos) {
                imperador.atributos[attrKey]++;
            }

            // 3. Gatilho de Ascensão (Nível)
            while (imperador.xp >= imperador.xpNecessario) {
                imperador.xp -= imperador.xpNecessario;
                imperador.nivel++;
                imperador.xpNecessario = Math.floor(imperador.xpNecessario * 1.5);
                alert(`👑 ASCENSÃO! Você alcançou o Nível ${imperador.nivel}!`);
            }

            // 4. Marca a Missão como Concluída para a Interface
            missao.concluida = 1;

            // 5. Sincroniza com o Monólito e Atualiza a Tela
            if (typeof adicionarProgressoConquista === "function") {
                adicionarProgressoConquista("o_virtuoso", 1);
            }
            
            atualizarTela(); 
            imperador.salvarEstado(); // Persiste o novo nível e o botão concluído no banco
        } else {
            const erroData = await resposta.json();
            alert("Interferência no Sistema: " + (erroData.mensagem || "Erro desconhecido"));
        }
    } catch (erro) {
        console.error("A conexão com o Monólito falhou:", erro);
        alert("O Sistema está offline.");
    }
}
async function equiparTitulo(nomeTitulo) {
  console.log("Tentando equipar o título:", nomeTitulo);
  if (!imperador.titulosDesbloqueados.includes(nomeTitulo)) {
    console.warn("Título não desbloqueado!");
    alert("Você ainda não conquistou o direito de usar esse título!");
    return;
  }
  const nomeUsuario = imperador.nome || localStorage.getItem("usuario_shadow");
  try {
    const resposta = await fetch("http://localhost:5000/equipar_titulo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: nomeUsuario,
        titulo: nomeTitulo,
      }),
    });

    if (resposta.ok) {
      imperador.tituloEquipado = nomeTitulo;
      const info = bancoTitulos[nomeTitulo];
      document.getElementById("titulo-desc").innerText = `Efeito: ${info.desc}`;
      registrarLog(`Titulo equipado: ${nomeTitulo}`);
      atualizarTela();
    }
  } catch (erro) {
    console.error(
      "Falha ao comunicar com o Monólito para equipar título:",
      erro,
    );
  }
}

function atualizarListaTitulos() {
  const select = document.getElementById("select-titulo");
  if (!select) return;

  select.innerHTML = "";

  let opcaoNeutra = document.createElement("option");
  opcaoNeutra.text = "Selecione um título...";
  opcaoNeutra.value = "";
  opcaoNeutra.disabled = true;

  if (
    !imperador.tituloEquipado ||
    imperador.tituloEquipado === "O mais fraco" ||
    imperador.tituloEquipado === "O MAIS FRACO"
  ) {
    opcaoNeutra.selected = true;
  }
  select.appendChild(opcaoNeutra);

  imperador.titulosDesbloqueados.forEach((titulo) => {
    let option = document.createElement("option");
    option.value = titulo;
    option.text = titulo;
    if (titulo === imperador.tituloEquipado) option.selected = true;
    select.appendChild(option);
  });
}

function mudarAbaLoja(abaAlvo) {
  let lojaVirtual = document.getElementById("loja-virtual");
  let lojaReal = document.getElementById("loja-real");
  let btnVirtual = document.getElementById("btn-aba-virtual");
  let btnReal = document.getElementById("btn-aba-real");

  if (abaAlvo === "loja-virtual") {
    lojaVirtual.style.display = "flex";
    lojaReal.style.display = "none";

    btnVirtual.style.backgroundColor = "rgba(0, 210, 255, 0.2)";
    btnReal.style.backgroundColor = "transparent";
  } else {
    lojaVirtual.style.display = "none";
    lojaReal.style.display = "flex";

    btnReal.style.backgroundColor = "rgba(168, 85, 247, 0.2)";
    btnVirtual.style.backgroundColor = "transparent";
  }
}

function comprarRecompensaReal(custo, nomeRecompensa) {
  if (imperador.ouro >= custo) {
    imperador.ouro -= custo;

    localStorage.setItem("save_imperador", JSON.stringify(imperador));
    atualizarTela();

    alert(
      ` TRANSACÇÃO APROVADA!\n\nVocê pagou ${custo} Ouro.\nO Sistema autoriza o resgate de: [${nomeRecompensa}].\n\nAproveite sua recompensa no mundo real, Imperador!`,
    );
  } else {
    alert(
      "Ouro insuficiente! A vida real exige mais esforço e sacrifício. Cumpra mais missões diárias!",
    );
  }
}

function usarItem(nomeDoItem) { 
    if (!nomeDoItem) return;

    // 1. O PODER DA POEIRA ESTELAR
    if (nomeDoItem === "Poeira Estelar") {
        let index = imperador.inventario.findIndex(i => (typeof i === "string" ? i : i.nome) === "Poeira Estelar");
        if (index !== -1) {
            imperador.inventario.splice(index, 1);
            imperador.mpMaximo += 5; 
            imperador.hpMaximo += 5;
            let xpGanho = Math.floor(imperador.xpNecessario * 0.15);
            if (xpGanho < 15) xpGanho = 15;
            imperador.xp += xpGanho; 
            
            alert(` Você absorveu a Poeira Estelar! Seus limites aumentaram em +5 (NV/EE) e ganhou +${xpGanho} XP!`);
            
            if (imperador.xp >= imperador.xpNecessario) {
                if(typeof imperador.subirDeNivel === 'function') {
                    imperador.subirDeNivel();
                }
                alert(` Subjugação completa! O Sistema reconhece sua ascensão.`);
            }
            
            imperador.salvarEstado();
            atualizarTela();
            if (typeof emBatalha !== 'undefined' && emBatalha) atualizarTelaMasmorra();
        }
        return; 
    }

    if (nomeDoItem === "Fragmento de Sombra") {
        alert(" Isso é um Material de Despertar. Ele não pode ser consumido.");
        return; 
    }

    let indexItem = imperador.inventario.findIndex(i => {
        let n = typeof i === "string" ? i : (i.nome || i[0]);
        return n === nomeDoItem;
    });

    if (indexItem === -1) return;

    imperador.inventario.splice(indexItem, 1);
    let itemInteligente = bancoDeItens[nomeDoItem];
    
    if (itemInteligente && typeof itemInteligente.usar === "function") {
        itemInteligente.usar(imperador); 
    } else {
        alert(`O sistema ainda não compreende a natureza do item: [${nomeDoItem}]`);
        imperador.inventario.push(nomeDoItem);
        return;
    }

    imperador.salvarEstado();
    atualizarTela(); 
    if (typeof renderizarInventario === "function") renderizarInventario(); 
    if (typeof emBatalha !== 'undefined' && emBatalha) {
        atualizarTelaMasmorra();
        let cofreBolsa = document.getElementById("bolsa-batalha");
        if (cofreBolsa) cofreBolsa.style.display = "none"; 
        if(typeof registrarLog === "function") {
            registrarLog(`Você usou [${nomeDoItem}]. O inimigo se prepara...`);
        }
        
        setTimeout(turnoDoMonstro, 1000); 
    }
}

function desequiparItem(tipoSlot) {
  let nomeItem = imperador.equipamentos[tipoSlot];

  if (!nomeItem) return;

  let itemObj = bancoDeItens[nomeItem];

  if (itemObj) {
    // REMOÇÃO DE BÔNUS
    if (itemObj.bonusForca)
      imperador.atributosBonus.forca -= itemObj.bonusForca;
    if (itemObj.bonusAgilidade)
      imperador.atributosBonus.agilidade -= itemObj.bonusAgilidade;
    if (itemObj.bonusInteligencia)
      imperador.atributosBonus.inteligencia -= itemObj.bonusInteligencia;
    if (itemObj.bonusVitalidade) {
      imperador.atributosBonus.vitalidade -= itemObj.bonusVitalidade;
      // Recalcula o HP Máximo imediatamente ao tirar a armadura
      imperador.hpMaximo =
        100 +
        (imperador.atributos.vitalidade + imperador.atributosBonus.vitalidade) *
          10;
      if (imperador.hpAtual > imperador.hpMaximo)
        imperador.hpAtual = imperador.hpMaximo;
    }
    // Garante que nada fique negativo
    if (imperador.atributosBonus.forca < 0) imperador.atributosBonus.forca = 0;
    if (imperador.atributosBonus.agilidade < 0)
      imperador.atributosBonus.agilidade = 0;
    if (imperador.atributosBonus.inteligencia < 0)
      imperador.atributosBonus.inteligencia = 0;
    if (imperador.atributosBonus.vitalidade < 0)
      imperador.atributosBonus.vitalidade = 0;

    imperador.inventario.push(nomeItem);
    imperador.equipamentos[tipoSlot] = null;
    imperador.salvarEstado();
    atualizarTela();
    renderizarInventario();

    alert(`[${nomeItem}] foi guardado na bolsa.`);
  }
}

function renderizarInventario() {
  let grade = document.getElementById("grade-inventario");
  if (!grade) return;
  grade.innerHTML = "";

  let itensReais = [];
  if (Array.isArray(imperador.inventario)) {
    itensReais = imperador.inventario.filter(
      (item) => item != null && item !== "" && item !== "undefined",
    );
  }
  imperador.inventario = itensReais;

  if (imperador.inventario.length === 0) {
    grade.innerHTML =
      '<p style="color: #555; font-size: 0.9em;">A bolsa está vazia.</p>';
    return;
  }

  const contagemItens = {};
    for (let item of imperador.inventario) {
        let nomeParaExibir = typeof item === "string" 
            ? item 
            : (Array.isArray(item) ? item[0] : item.nome || "Item Misterioso");
        
        // Soma +1 na pilha deste item
        contagemItens[nomeParaExibir] = (contagemItens[nomeParaExibir] || 0) + 1;
    }
    // 3. Agora contagemItens tem o formato { "Poção de Força": 3, "Elixir de Agilidade": 2 }
    for (let [nomeItem, quantidade] of Object.entries(contagemItens)) {
        let botaoItem = document.createElement("button");
        botaoItem.className = "btn-complete";
        botaoItem.style.padding = "5px 10px";
        botaoItem.style.fontSize = "0.8em";
        botaoItem.innerText = `Usar ${nomeItem} (x${quantidade})`;
        botaoItem.onclick = function () {
            usarItem(nomeItem); 
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
    if (nivel >= 100) return "S";
    if (nivel >= 76) return "A";
    if (nivel >= 51) return "B";
    if (nivel >= 26) return "C";
    if (nivel >= 11) return "D";
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
  E: {
    minLvl: 1,
    MaxLvl: 10,
    nomes: ["Goblin", "Morcego da Caverna", "Slime"],
  },
  D: {
    minLvl: 11,
    MaxLvl: 25,
    nomes: ["Orc Guerreiro", "Lobo das Sombras", "Zumbi"],
  },
  C: {
    minLvl: 26,
    MaxLvl: 50,
    nomes: ["Lobo Alfa", "Golem de Pedra", "Vampiro Inferior"],
  },
  B: {
    minLvl: 51,
    MaxLvl: 75,
    nomes: ["Cavaleiro Espectral", "Golem de Metal", "Vampiro Superior"],
  },
  A: {
    minLvl: 76,
    MaxLvl: 100,
    nomes: ["Dragão Ancião", "Feiticeiro Sombrio", "Gigante de Ferro"],
  },
  S: {
    minLvl: 101,
    MaxLvl: 200,
    nomes: ["Deus da Guerra", "Lorde dos Pesadelos", "Titã de Fogo"],
  },
};

//Construir o monstro baseado no portal
function abrirPortal(rankPortal) {
  let regras = regrasPortais[rankPortal];

  //Sorteia o nivel do monstro dentro da faixa do portal
  let nivelSorteado =
    Math.floor(Math.random() * (regras.MaxLvl - regras.minLvl + 1)) +
    regras.minLvl;

  //Escolhe um nome aleatório da lista do rank
  let nomeMonstro =
    regras.nomes[Math.floor(Math.random() * regras.nomes.length)];

  //Red Gate
  let mutacao = Math.random(); //sorteia entre 0.00 e 0.99
  let isPortalVermelho = mutacao <= 0.1;

  if (isPortalVermelho) {
    nivelSorteado += 15; //O nivel extrapola o limite
    nomeMonstro = nomeMonstro + " com Aura + Ego";
    alert(
      "ALERTA DO SISTEMA: O Portal sofreu uma mutação! PORTAL VERMELHO DETECTADO!",
    );
  }
  //Status escalam com o lvl
  //Red Gate os multiplicadores dobram
  let multiDificuldade = isPortalVermelho ? 2.5 : 1;

  let hpForjado =
    Math.floor(nivelSorteado * 25 + Math.pow(nivelSorteado, 1.25) * 15) *
    multiDificuldade;
  let atkForjado =
    Math.floor(nivelSorteado * 5 + Math.pow(nivelSorteado, 1.15) * 4) *
    multiDificuldade;
  let xpForjado =
    Math.floor(Math.pow(nivelSorteado, 1.5) * 30) * multiDificuldade;
  let ouroForjado =
    Math.floor(Math.pow(nivelSorteado, 1.3) * 15) * multiDificuldade;

  // Instancia a criatura no mundo
  monstroAtual = new Inimigo(
    nomeMonstro,
    nivelSorteado,
    hpForjado,
    atkForjado,
    xpForjado,
    ouroForjado,
  );

  //Prepara o cenário
  emBatalha = true;
  document.getElementById("tela-masmorra").style.display = "block";

  //Muda a cor do title se for red
  let tituloMasmorra = document.getElementById("titulo-masmorra");
  if (tituloMasmorra) {
    tituloMasmorra.innerText = isPortalVermelho
      ? "PORTAL VERMELHO"
      : `Masmorra Rank ${rankPortal}`;
    tituloMasmorra.style.color = isPortalVermelho ? "#ef4444" : "#4ade80";
    tituloMasmorra.style.textShadow = isPortalVermelho
      ? "0 0 15px red"
      : "0 0 10px green";
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
  constructor(nome, preco, curaHp, curaMp) {
    this.nome = nome;
    this.preco = preco;
    this.curaHp = curaHp;
    this.curaMp = curaMp;
  }
  //A poção sabe qm curar
  usar(alvo) {
    let mensagem = `Você bebeu a [${this.nome}]!`;

    if (this.curaHp > 0) {
      alvo.hpAtual += this.curaHp;
      if (alvo.hpAtual > alvo.hpMaximo) alvo.hpAtual = alvo.hpMaximo;
      mensagem += "NV restaurado!";
    }
    if (this.curaMp > 0) {
      alvo.mpAtual += this.curaMp;
      if (alvo.mpAtual > alvo.mpMaximo) alvo.mpAtual = alvo.mpMaximo;
      mensagem += "EE restaurado!";
    }
    alert(mensagem);
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
    this.tipo = "arma";
  }

  //Arma sabe como equipar e lidar com armas antigas
  usar(alvo) {
    //Se não existir gaveta de bonus, irei cira-la
    if (!alvo.atributosBonus) {
      alvo.atributosBonus = {
        forca: 0,
        inteligencia: 0,
        agilidade: 0,
        vitalidade: 0,
      };
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
        if (alvo.atributosBonus.agilidade < 0)
          alvo.atributosBonus.agilidade = 0;
        if (alvo.atributosBonus.inteligencia < 0)
          alvo.atributosBonus.inteligencia = 0;
      }
    }
    //Equipa a nova arma e aplica o bonus
    alvo.equipamentos.arma = this.nome;
    alvo.atributosBonus.forca += this.bonusForca;
    alvo.atributosBonus.agilidade += this.bonusAgilidade;
    alvo.atributosBonus.inteligencia += this.bonusInteligencia;

    alert(
      `[${this.nome}] equipada com sucesso! Força +${this.bonusForca}, Agilidade +${this.bonusAgilidade}, Inteligencia +${this.bonusInteligencia}`,
    );
  }
}

//Forma 3: Escudo
class Escudo {
  constructor(nome, preco, bonusVitalidade) {
    this.nome = nome;
    this.preco = preco;
    this.bonusVitalidade = bonusVitalidade;
    this.tipo = "escudo";
  }

  usar(alvo) {
    if (alvo.equipamentos.escudo !== null) {
      alvo.inventario.push(alvo.equipamentos.escudo);
      let itemAntigo = bancoDeItens[alvo.equipamentos.escudo];
      if (itemAntigo)
        alvo.atributosBonus.vitalidade -= itemAntigo.bonusVitalidade;
    }

    alvo.equipamentos.escudo = this.nome;
    alvo.atributosBonus.vitalidade += this.bonusVitalidade;
    alvo.hpMaximo =
      100 + (alvo.atributos.vitalidade + alvo.atributosBonus.vitalidade) * 10;

    alert(
      `[${this.nome}] equipado no braço esquerdo! Vitalidade +${this.bonusVitalidade}.`,
    );
  }
}
//Forma 4: Habilidades
class Habilidade {
  constructor(nome, custoMana, multiplicador, atributoBase, efeitoDesc) {
    this.nome = nome;
    this.custoMana = custoMana;
    this.multiplicador = multiplicador;
    this.atributoBase = atributoBase;
    this.efeitoDesc = efeitoDesc;
  }
}

//Forma 5: Armaduras
class Armadura {
  constructor(nome, preco, bonusVitalidade) {
    this.nome = nome;
    this.preco = preco;
    this.bonusVitalidade = bonusVitalidade;
  }

  usar(alvo) {
    if (!alvo.atributosBonus)
      alvo.atributosBonus = {
        forca: 0,
        inteligencia: 0,
        agilidade: 0,
        vitalidade: 0,
      };
    if (!alvo.equipamentos)
      alvo.equipamentos = {
        arma: null,
        escudo: null,
        armadura: null,
        acessorio: null,
      };

    //Troca de armadura
    if (alvo.equipamentos.armadura !== null) {
      let itemAntigo = bancoDeItens[alvo.equipamentos.armadura];
      alvo.inventario.push(alvo.equipamentos.armadura);
      if (itemAntigo)
        alvo.atributosBonus.vitalidade -= itemAntigo.bonusVitalidade;
    }

    alvo.equipamentos.armadura = this.nome;
    alvo.atributosBonus.vitalidade += this.bonusVitalidade;

    //Recalcula HP máximo após mudar Vitalidade
    alvo.hpMaximo =
      100 + (alvo.atributos.vitalidade + alvo.atributosBonus.vitalidade) * 10;

    alert(`[${this.nome}] equipada! Vitalidade +${this.bonusVitalidade}.`);
  }
}
//Forma 6: Acessorio
class Acessorio {
  constructor(nome, preco, bonusAgi, bonusInt) {
    this.nome = nome;
    this.preco = preco;
    this.bonusAgilidade = bonusAgi;
    this.bonusInteligencia = bonusInt;
  }

  usar(alvo) {
    if (!alvo.atributosBonus)
      alvo.atributosBonus = {
        forca: 0,
        inteligencia: 0,
        agilidade: 0,
        vitalidade: 0,
      };
    if (!alvo.equipamentos)
      alvo.equipamentos = {
        arma: null,
        escudo: null,
        armadura: null,
        acessorio: null,
      };
    if (alvo.equipamentos.acessorio) {
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

    alert(
      `${this.nome} equipado! Agilidade +${this.bonusAgilidade}, Inteligencia +${this.bonusInteligencia}.`,
    );
  }
}
//Pra dar fuga
class MagiaFuga {
  constructor(nome, preco) {
    this.nome = nome;
    this.preco = preco;
  }

  usar(alvo) {
    alert(
      `Você rasgou o [${this.nome}]! A magia envolve seu corpo e você é teletransportado para fora da masmorra.`,
    );
    fugirMasmorra();
    if (monstroAtual) monstroAtual.hpAtual = monstroAtual.hpMaximo; // Pra resetar o mob
    atualizarTelaMasmorra();
  }
}
//Drop de itens
function gerarLoot() {
    // 1. Sorteia um número de 1 a 100
    let dadoLoot = Math.floor(Math.random() * 100) + 1; 
    let itemDropado = null;

    // 2. Tabela de Drops para CHEFES (Ex: Monstros nível 10+ ou com "Lorde" no nome)
    if (monstroAtual.nivel >= 10 || monstroAtual.nome.includes("Lorde") || monstroAtual.nome.includes("Rei")) {
        if (dadoLoot <= 30) { 
            return null; 
        } else if (dadoLoot <= 60) {
            itemDropado = "Poção de Cura (G)";
        } else if (dadoLoot <= 85) {
            itemDropado = "Poção de Mana (G)";
        } else {
            itemDropado = "Poeira Estelar"; 
        }
    } 
    // 3. Tabela de Drops para MONSTROS COMUNS
    else {
        if (dadoLoot <= 50) { 
            return null;
        } else if (dadoLoot <= 75) {
            itemDropado = "Poção de Cura (P)";
        } else if (dadoLoot <= 95) {
            itemDropado = "Poção de Mana (P)";
        } else {
            itemDropado = "Fragmento de Sombra"; // Item inútil temporariamente, bom pra vender depois!
        }
    }

    if (itemDropado) {
        imperador.inventario.push(itemDropado);
    }
    
    return itemDropado;
}
//Cofre de itens
const bancoDeItens = {
  // Poções (Nome, Preço, CuraHP, CuraMP)
  "Poção de Cura (P)": new Pocao("Poção de Cura (P)", 30, 50, 0),
  "Poção de Cura (M)": new Pocao("Poção de Cura (M)", 80, 150, 0),
  "Poção de Cura (G)": new Pocao("Poção de Cura (G)", 200, 500, 0),
  "Poção de Mana (P)": new Pocao("Poção de Mana (P)", 30, 0, 50),
  "Poção de Mana (M)": new Pocao("Poção de Mana (M)", 80, 0, 150),
  "Poção de Mana (G)": new Pocao("Poção de Mana (G)", 200, 0, 500),
  // Armas (Nome, Preço, Força, Inteligência, Agilidade)
  "Adaga Enferrujada": new Arma("Adaga Enferrujada", 100, 0, 0, 2),
  "Livro Antigo": new Arma("Livro Antigo", 150, 0, 5, 0),
  "Espada Curta do Cavaleiro": new Arma("Espada Curta do Cavaleiro", 500, 5, 0, 0,),
  //Escudos
  "Escudo de Madeira": new Escudo("Escudo de Madeira", 400, 5),
  //Armaduras (Nome, Preço, Vitalidade)
  "Armadura de Couro de Sombra": new Armadura("Armadura de Couro de Sombra", 1200, 10),
  "Armadura de Ferro": new Armadura("Armadura de Ferro", 500, 15),
  //Acessorios (Nome, Preço, Bônus Agi, Bônus Int)
  "Anel da Agilidade": new Acessorio("Anel da Agilidade", 120, 3, 0),
  "Colar do Sábio": new Acessorio("Colar do Sábio", 200, 0, 8),
  "Anel de Mana": new Acessorio("Anel de Mana", 150, 0, 5),
  //Itens Mágicos (Nome, Preço)
  "Pergaminho de Retorno": new MagiaFuga("Pergaminho de Retorno", 200),
};

//Cofre de habilidades
//nome, custoMana, multiplicador, atributoBase, descricao
const grimorio = {
  // --- MAGIAS (Escala com Inteligência) ---
  "Seta de Mana": new Habilidade(
    "Seta de Mana",
    15,
    1.8,
    "inteligencia",
    "Dano mágico focado.",
  ),
  "Explosão Arcana": new Habilidade(
    "Explosão Arcana",
    40,
    3.5,
    "inteligencia",
    "Dano massivo, mas gasta muita mana.",
  ),
  "Dreno de Vida": new Habilidade(
    "Dreno de Vida",
    25,
    1.8,
    "inteligencia",
    "Causa dano e cura um pouco de HP.",
  ),
  // --- FORÇA BRUTA (Escala com Força) ---
  "Golpe Devastador": new Habilidade(
    "Golpe Devastador",
    20,
    1.8,
    "forca",
    "Um ataque pesado focado em esmagar a defesa inimiga.",
  ),
  "Golpe do Dragão": new Habilidade(
    "Golpe do Dragão",
    45,
    3.0,
    "forca",
    "Um golpe brutal no chão que causa dano extremo.",
  ),

  // --- ASSASSINATO (Escala com Agilidade) ---
  "Corte Fantasma": new Habilidade(
    "Corte Fantasma",
    18,
    1.6,
    "agilidade",
    "Um ataque tão rápido que a lâmina se torna invisível.",
  ),
  "Dança das Lâminas": new Habilidade(
    "Dança das Lâminas",
    35,
    2.5,
    "agilidade",
    "Múltiplos cortes precisos em pontos vitais.",
  ),
};

//Core de titulos
const bancoTitulos = {
  Iniciante: { buff: {}, desc: "Um novo despertar." }, //padrao
  Exterminador: { buff: { forca: 5 }, desc: "Dano físico aumentado em +5." }, //feito
  "Mercador de Almas": {
    buff: { ouroMult: 0.2 },
    desc: "Ganha 20% a mais de ouro.",
  }, //feito
  Colosso: {
    buff: { vitalidade: 15 },
    desc: "Aumenta NV máximo consideravelmente ( +15 ).",
  },
  "O Mago": {
    buff: { inteligencia: 10 },
    desc: "Poder mágico elevado em +10.",
  }, //feito
  "Mestre do Kokusen": {
    buff: { critico: 0.1 },
    desc: "Aumenta a chance de crítico em 10%.",
  }, //feito
  "Monarca Soberano": {
    buff: { todos: 25 },
    desc: "O auge do poder! Todos os atributos aumentados em +25.",
  }, //feito
  "Matador de Deuses": {
    buff: { todos: 5 },
    desc: "Banhou-se no sangue divino, aumentando todos os atributos em +5.",
  }, //feito
  "Sábio das Sombras": {
    buff: { danoMagicoMult: 0.15 },
    desc: "Atingiu 20 de Inteligência Base. Dano mágico elevado.",
  }, //feito
  "O Virtuoso": {
    buff: { vitalidade: 20 },
    desc: "Completou Missões Reais. Corpo e mente blindados.",
  },
  Prodígio: {
    buff: { vitalidade: 10 },
    desc: "Resistência forjada pelo esforço incansável.",
  },
  "Caminho dos Dois Céus": {
    buff: { mpRegen: 2 },
    desc: "A meditação constante permite regenerar a mana.",
  }, //feito
  "Farmador de Aura": {
    buff: { agilidade: 10 },
    desc: "Uma sombra mortal contra inimigos de elite.",
  }, //feito
  "Soberano da Masmorra": {
    buff: { todos: 15 },
    desc: "O abismo curva-se perante os seus milhares de abates.",
  }, //feito
  "Capitalista Arcano": {
    buff: { ouroMult: 0.1 },
    desc: "O ouro atrai mais ouro. Ganha 10% a mais de saque.",
  }, //feito
};

// O Mapa de Conhecimento das Conquistas
const descricoesConquistas = {
  carniceiro_portais: "Abater 50 Monstros na Masmorra.",
  matador_deuses: "Derrotar o Chefe de Elite.",
  riqueza_eterna: "Acumular um total de 5.000 de Ouro.",
  monarca_supremo: "Alcançar o ápice do Nível do Sistema.",
  carrasco_elites: "Abater 10 Inimigos com Aura + Ego.",
  soberano_masmorra: "Abater um total de 500 Monstros.",
  capitalista_arcano: "Gastar 10.000 Ouro na Loja.",
  o_virtuoso: "Resgatar 5 Recompensas de Missões Reais.",
  mente_inabalavel: "Meditar 50 vezes.",
  esforco_incansavel: "Concluir 100 Treinos Repetíveis.",
  erudito_sombras: "Alcançar 20 de Inteligência Base.",
};

//Abrir portais
function entrarMasmorra() {
  //Escolhe um indice aleatório do bestiário
  let indiceAleatorio = Math.floor(Math.random() * bestiario.length);
  //Clono o monstro da lista para que o original não fique com hp baixo da próxima vez
  let modelo = bestiario[indiceAleatorio];
  monstroAtual = new Inimigo(
    modelo.nome,
    modelo.nivel,
    modelo.hpMaximo,
    modelo.ataqueBase,
    modelo.xpDrop,
    modelo.ouroDrop,
  );

  document.getElementById("tela-masmorra").style.display = "block";
  document.getElementById("log-batalha").innerText =
    `Um ${monstroAtual.nome} Rank ${monstroAtual.nivel} apareceu!`;

  atualizarTelaMasmorra();
}

//Logica batalhas
function registrarLog(mensagem) {
  document.getElementById("log-batalha").innerText = mensagem;
}

function atualizarTelaMasmorra() {
  //Atualizar o status do monstro na tela da masmorra
  let nomeMonstroEl = document.getElementById("monstro-nome");
  let nivelMonstroEl = document.getElementById("monstro-nivel");

  if (nomeMonstroEl) nomeMonstroEl.innerText = monstroAtual.nome;
  if (nivelMonstroEl) {
    nivelMonstroEl.innerText = `${monstroAtual.rank} (Nvl ${monstroAtual.nivel})`;
  }

  document.getElementById("monstro-hp-texto").innerText =
    `${monstroAtual.hpAtual}/${monstroAtual.hpMaximo}`;
  let porcentagem = (monstroAtual.hpAtual / monstroAtual.hpMaximo) * 100;
  document.getElementById("monstro-hp-bar").style.width = porcentagem + "%";

  let hpTextoBatalha = document.getElementById("batalha-player-hp-texto");
  let hpBarraBatalha = document.getElementById("batalha-player-hp-bar");

  //Pra att só o que tem na tela
  if (hpTextoBatalha && hpBarraBatalha) {
    hpTextoBatalha.innerText = `${imperador.hpAtual}/${imperador.hpMaximo}`;
    let porcentagemImperador = (imperador.hpAtual / imperador.hpMaximo) * 100;
    hpBarraBatalha.style.width = porcentagemImperador + "%";
  }
  let mpTextoBatalha = document.getElementById("batalha-player-mp-texto");
  let mpBarraBatalha = document.getElementById("batalha-player-mp-bar");

  if (mpTextoBatalha && mpBarraBatalha) {
    mpTextoBatalha.innerText = `${imperador.mpAtual}/${imperador.mpMaximo}`;
    let porcentagemMP = (imperador.mpAtual / imperador.mpMaximo) * 100;
    mpBarraBatalha.style.width = porcentagemMP + "%";
  }
}

/**
 * Realiza o ciclo de combate por turnos entre o Jogador e o Monstro.
 * Implementa assincronicidade para simular o tempo de resposta da IA.
 */
function atacarMonstro() {
  if (monstroAtual.hpAtual <= 0) return;
  alternarBotoesCombate(false);
  let forcaTotal =
    imperador.atributos.forca +
    (imperador.atributosBonus ? imperador.atributosBonus.forca : 0);
  let agiTotal =
    imperador.atributos.agilidade +
    (imperador.atributosBonus ? imperador.atributosBonus.agilidade : 0);
  let intTotal =
    imperador.atributos.inteligencia + imperador.atributosBonus.inteligencia;
  let chanceBase = agiTotal * 1.5;
  let chanceCritico = Math.min(chanceBase + imperador.bonusCritico * 100, 100);
  let isCrit = Math.random() * 100 < chanceCritico;
  let danoFinal = 0;
  let armaEquipada = bancoDeItens[imperador.equipamentos.arma];
  if (armaEquipada && armaEquipada.bonusInteligencia > 0) {
    // Dano Mágico
    let danoBase = Math.floor(Math.random() * 10) + intTotal;
    danoFinal = Math.floor(danoBase * (1 + imperador.bonusDanoMagico));
    console.log("Ataque Mágico desferido com bônus arcano!");
  } else {
    // Dano Físico
    danoFinal = isCrit ? forcaTotal * 4 : forcaTotal * 2;
    console.log("Ataque Físico desferido!");
  }
  monstroAtual.receberDano(danoFinal);

  // O Log de Batalha agora narra o acerto crítico
  if (isCrit) {
    registrarLog(
      ` CRÍTICO! Você se moveu como um vulto e causou ${danoFinal} de dano!`,
    );
  } else {
    registrarLog(`Você atacou com precisão e causou ${danoFinal} de dano!`);
  }
  if (imperador.bonusMpRegen > 0) {
    imperador.mpAtual = imperador.bonusMpRegen;
    if (imperador.mpAtual > imperador.mpMaximo) {
      imperador.mpAtual = imperador.mpMaximo;
    }
  }
  atualizarTelaMasmorra();

  if (monstroAtual.hpAtual <= 0) {
     let itemDropado = gerarLoot();
          let msgDrop = itemDropado ? ` Você obteve: ${itemDropado}!` : "";
    registrarLog(
      `O ${monstroAtual.nome} foi abatido! Você adquiriu +${monstroAtual.xpDrop} XP e +${monstroAtual.ouroDrop} Ouro.${msgDrop}`,
    );
    imperador.xp += monstroAtual.xpDrop;
    let ouroGanho = Math.floor(
      monstroAtual.ouroDrop * (1 + imperador.bonusOuro),
    );
    imperador.ouro += ouroGanho;
    adicionarProgressoConquista("carniceiro_portais", 1);
    adicionarProgressoConquista("soberano_masmorra", 1);
    adicionarProgressoConquista("riqueza_eterna", ouroGanho);
    let nomeInimigo = monstroAtual.nome.toLowerCase();
    if (monstroAtual.nome.includes("com Aura + Ego")) {
      adicionarProgressoConquista("carrasco_elites", 1);
      registrarLog(
        `A essência do Red Gate foi absorvida! Progresso de Farmador de Aura obtido.`,
      );
    }
    if (imperador.xp >= imperador.xpNecessario) {
      imperador.subirDeNivel();
      alert(
        `Parabéns, Imperador! Você subiu para o nível ${imperador.nivel}! O Sistema reconhece o seu crescimento.`,
      );
    }

    //Verifica se o monstro é a centopeia e da recompensas melhores
    if (monstroAtual.nome === "Centopeia Venenosa do Deserto") {
      adicionarProgressoConquista("matador_deuses", 1);
      let maiorAtrib = "forca";
      let valorM = imperador.atributos.forca;
      if (imperador.atributos.agilidade > valorM) {
        maiorAtrib = "agilidade";
        valorM = imperador.atributos.agilidade;
      }
      if (imperador.atributos.inteligencia > valorM) {
        maiorAtrib = "inteligencia";
        valorM = imperador.atributos.inteligencia;
      }

      const itemLendario = {
        id: `elixir_${maiorAtrib}_${Date.now()}`,
        nome: `Elixir de Superação [${maiorAtrib.toUpperCase()}]`,
        descricao: `O Sistema reconhece seu esforço. Aumenta +1 de ${maiorAtrib.toUpperCase} permanentemente.`,
        tipo: "uso",
        efeito: maiorAtrib,
        valor_boost: 1,
        raridade: "lendario",
      };

      imperador.inventario.push(itemLendario);
      registrarLog(
        `[SISTEMA] Recompensa Lendária Gerada: ${itemLendario.nome}!`,
      );

      emBatalha = false;

      imperador.salvarEstado().then(() => {
        atualizarTela();
        vencerPunicao();
      });
      return;
    }
    emBatalha = false;
    imperador.salvarEstado();
    atualizarTela();

    setTimeout(() => {
      fugirMasmorra();
      alternarBotoesCombate(true);
      alert(
        `A Masmorra se dissolve. +${monstroAtual.xpDrop} XP e +${monstroAtual.ouroDrop} Ouro extraídos. Você obteve: ${itemDropado || "Nada"}.`,
      );
    }, 1500);
    return;
  }

  turnoDoMonstro();
}

function conjurarHabilidade(nomeHabilidade) {
  if (monstroAtual.hpAtual <= 0) return;
  alternarBotoesCombate(false);
  let habilidade = grimorio[nomeHabilidade];
  let atributoChave = habilidade.atributoBase;
  let valorBase = imperador.atributos[atributoChave] || 0;
  let valorBonus = imperador.atributosBonus[atributoChave] || 0;
  let poderTotal = valorBase + valorBonus;

  if (imperador.mpAtual < habilidade.custoMana) {
    registrarLog(" Mana insuficiente para conjurar " + habilidade.nome + "!");
    alternarBotoesCombate(true);
    return;
  }

  imperador.mpAtual -= habilidade.custoMana;
  let danoHabilidade =
    Math.floor(poderTotal * habilidade.multiplicador) +
    Math.floor(Math.random() * 5);
    monstroAtual.receberDano(danoHabilidade);

  // Efeito Especial (Ex: Dreno de Vida)
  if (nomeHabilidade === "Dreno de Vida") {
    let cura = Math.floor(danoHabilidade * 0.6);
    imperador.hpAtual = Math.min(imperador.hpAtual + cura, imperador.hpMaximo);
    registrarLog(` [${habilidade.nome}] causou ${danoHabilidade} de dano e restaurou ${cura} HP!`);
  } else {

  registrarLog(` [${habilidade.nome}] causou ${danoHabilidade} de dano!`);
  }

  atualizarTelaMasmorra();
  if (monstroAtual.hpAtual > 0) {
    setTimeout(turnoDoMonstro, 1000);
  } else {
        setTimeout(() => {
          let itemDropado = gerarLoot();
          let msgDrop = itemDropado ? ` Você obteve: ${itemDropado}!` : "";
            fugirMasmorra(); 
            alternarBotoesCombate(true);
            alert(`A Masmorra se dissolve. +${monstroAtual.xpDrop} XP e +${monstroAtual.ouroDrop} Ouro extraídos.${msgDrop}`);

            imperador.salvarEstado(); 
        }, 1500);
    }
}

function turnoDoMonstro() {
    if (!emBatalha || monstroAtual.hpAtual <= 0) return;

    const grimorioMonstros = {
        "Morcego da Caverna": { nomeMagia: "Mordida Sanguinária", chance: 25, multiplicador: 1.2, roubaVida: true },
        "Lobo das Sombras": { nomeMagia: "Ataque Feroz na Jugular", chance: 20, multiplicador: 1.8, roubaVida: false },
        "Slime Ácido": { nomeMagia: "Cuspe Corrosivo", chance: 30, multiplicador: 1.5, roubaVida: false },
        "Lorde dos Pesadelos": { nomeMagia: "Devorar Mentes", chance: 35, multiplicador: 2.2, roubaVida: true },
        "Dragão Inferior": { nomeMagia: "Bafo de Fogo", chance: 40, multiplicador: 2.5, roubaVida: false }
    };

    let habilidade = grimorioMonstros[monstroAtual.nome] || {
        nomeMagia: monstroAtual.nome.includes("Lorde") ? "Fúria do Lorde" : "Golpe Brutal",
        chance: monstroAtual.nome.includes("Lorde") ? 30 : 15,
        multiplicador: 1.5,
        roubaVida: false
    };

    setTimeout(() => {
        let dadoHabilidade = Math.floor(Math.random() * 100) + 1;
        let danoCausado = 0;
        let mensagemLog = "";

        if (dadoHabilidade <= habilidade.chance) {
            danoCausado = Math.floor(monstroAtual.ataqueBase * habilidade.multiplicador) - (imperador.atributos.vitalidade || 0);
            if (danoCausado < 1) danoCausado = 1;
            
            mensagemLog = ` ALERTA: O [${monstroAtual.nome}] usou a habilidade [${habilidade.nomeMagia}] e causou ${danoCausado} de dano!`;

            if (habilidade.roubaVida) {
                let curaMonstro = Math.floor(danoCausado * 0.5);
                monstroAtual.hpAtual += curaMonstro;
                if (monstroAtual.hpAtual > monstroAtual.hpMaximo) monstroAtual.hpAtual = monstroAtual.hpMaximo; 
                mensagemLog += ` O inimigo sugou sua vitalidade e recuperou ${curaMonstro} de Vida!`;
            }
        } else {
            danoCausado = monstroAtual.ataqueBase - (imperador.atributos.vitalidade || 0);
            if (danoCausado < 1) danoCausado = 1;
            mensagemLog = `O [${monstroAtual.nome}] atacou e causou ${danoCausado} de dano.`;
        }

        imperador.hpAtual -= danoCausado;
        registrarLog(mensagemLog);
        atualizarTela();
        atualizarTelaMasmorra();

        if (imperador.hpAtual <= 0) {
            registrarLog(`A sua visão escurece . . . Você foi abatido.`);
            alert("O Sistema ativou a proteção e te salvou com 1 de HP!");
            imperador.hpAtual = 1;
            imperador.salvarEstado();
            atualizarTela();
            fugirMasmorra();
            monstroAtual.hpAtual = monstroAtual.hpMaximo;
            alternarBotoesCombate(true);
            emBatalha = false;
            atualizarTelaMasmorra();
        } else {
            alternarBotoesCombate(true);
        }
    }, 1000);
}

function abrirBolsaBatalha() { 
    let cofreBolsa = document.getElementById("bolsa-batalha"); 
    let gavetaBolsa = document.getElementById("grade-bolsa-batalha"); 

    if (!cofreBolsa || !gavetaBolsa) return;

    if (cofreBolsa.style.display === "block") {
        cofreBolsa.style.display = "none";
        gavetaBolsa.innerHTML = ""; 
        return;
    }

    cofreBolsa.style.display = "block";
    gavetaBolsa.innerHTML = ""; 

    let itensValidos = imperador.inventario.filter(
        (item) => item !== null && item !== "" && item !== "undefined"
    );

    if (itensValidos.length === 0) {
        gavetaBolsa.innerHTML = '<p style="color: #ccc; width: 100%; text-align: center;">A bolsa está vazia.</p>';
        return;
    }

    const contagemItens = {};
    for (let item of itensValidos) {
        let nomeParaExibir = typeof item === "string" 
            ? item 
            : (Array.isArray(item) ? item[0] : item.nome || "Item Misterioso");
        contagemItens[nomeParaExibir] = (contagemItens[nomeParaExibir] || 0) + 1;
    }

    for (let [nomeItem, quantidade] of Object.entries(contagemItens)) {
        let botaoItem = document.createElement("button");
        botaoItem.className = "btn-combate"; 
        botaoItem.innerText = `Usar ${nomeItem} (x${quantidade})`;

        botaoItem.onclick = function () {
            usarItem(nomeItem);
            cofreBolsa.style.display = "none";
            gavetaBolsa.innerHTML = "";
        };

        gavetaBolsa.appendChild(botaoItem);
    }
}

function fugirMasmorra() {
  document.getElementById("tela-masmorra").style.display = "none";
  emBatalha = false;
}

function verificarStatusPunicao(dados) {
  if (dados.status_punicao === 1 || dados.status_punicao === true) {
    // 1. Precisei disso, pq a centopeia tava reduzindo meus status permanentemente caso eu perdesse a luta
    imperador.statusReal = {
      forca: imperador.atributos.forca,
      agilidade: imperador.atributos.agilidade,
      inteligencia: imperador.atributos.inteligencia,
      vitalidade: imperador.atributos.vitalidade,
    };
    // 2. Aplica o Debuff de 50%
    imperador.atributos.forca = Math.floor(imperador.atributos.forca / 2);
    imperador.atributos.agilidade = Math.floor(
      imperador.atributos.agilidade / 2,
    );
    imperador.atributos.inteligencia = Math.floor(
      imperador.atributos.inteligencia / 2,
    );
    imperador.atributos.vitalidade = Math.floor(
      imperador.atributos.vitalidade / 2,
    );
    imperador.hpMaximo = Math.floor(imperador.hpMaximo / 2);
    imperador.mpMaximo = Math.floor(imperador.mpMaximo / 2);

    if (imperador.hpAtual > imperador.hpMaximo)
      imperador.hpAtual = imperador.hpMaximo;
    if (imperador.mpAtual > imperador.mpMaximo)
      imperador.mpAtual = imperador.mpMaximo;

    exibirAlertaSistema();
  }
}

function exibirAlertaSistema() {
  const msg = `
        <div class="alerta-sistema-vermelho">
            <h1>[ALERTA: O SISTEMA ESTÁ INSATISFEITO]</h1>
            <p>Você falhou em concluir a missão diária.</p>
            <p>PENALIDADE ATIVADA: FADIGA MUSCULAR</p>
            <p>Todos os status foram reduzidos em 50%.</p>
            <button onclick="entrarPenaltyZone()">ENTRAR NA MASMORRA DE PUNIÇÃO</button>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", msg);
}

function entrarPenaltyZone() {
  const alerta = document.querySelector(".alerta-sistema-vermelho");
  if (alerta) alerta.remove();

  const nivel = imperador.nivel;
  //Centopeia aqui
  monstroAtual = {
    nome: "Centopeia Venenosa do Deserto",
    hpMaximo: 100 + nivel * 30,
    hpAtual: 100 + nivel * 30,
    ataqueBase: 10 + nivel * 3,
    defesa: 5 + nivel,
    xpDrop: 150 + nivel * 20,
    ouroDrop: 15 + nivel * 2,
    receberDano: function (dano) {
      this.hpAtual -= dano;
      if (this.hpAtual < 0) this.hpAtual = 0;
    },
  };
  emBatalha = true;
  atualizarTelaMasmorra();
  document.getElementById("monstro-nome").innerText = monstroAtual.nome;
  document.getElementById("monstro-hp-texto").innerText =
    monstroAtual.hpAtual + "/" + monstroAtual.hpMaximo;
  document.getElementById("tela-masmorra").style.display = "block";

  if (typeof registrarLog === "function") {
    registrarLog("O Sistema teleportou você para a Penalty Zone. Sobreviva!");
  }
}

async function vencerPunicao() {
  try {
    console.log("Tentando limpar a punição no Monólito...");
    const resposta = await fetch("http://localhost:5000/limpar_punicao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: imperador.nome }),
    });

    if (resposta.ok) {
      alert(
        "A Penalty Zone se desfaz. Seus atributos originais foram restaurados.",
      );
      location.reload();
    } else {
      console.error("O servidor não respondeu adequadamente.");
      location.reload();
    }
  } catch (erro) {
    console.error("Erro na comunicação com o sistema", erro);
    location.reload();
  }
}

// Função para gerar o Hash de integridade
async function gerarLacre(dados) {
  const chaveSecreta = "SENHA_ULTRA_SECRETA_DO_IMPERADOR"; // Nunca revele
  const mensagem =
    String(dados.nivel) + String(dados.ouro) + String(dados.xp) + chaveSecreta;
  const encoder = new TextEncoder();
  const data = encoder.encode(mensagem);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function forjarSeloImperial() {
  const nomeUsuario = imperador.nome || localStorage.getItem("usuario_shadow");
  if (!nomeUsuario) return;

  try {
    const resposta = await fetch("http://localhost:5000/autenticar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: nomeUsuario }),
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      // Guarda o Selo na mochila do navegador
      localStorage.setItem("selo_imperial", dados.token);
      console.log("Selo Imperial reconhecido pelo Monólito!");
    } else {
      console.warn("O Monólito recusou a sua identidade.");
    }
  } catch (erro) {
    console.error("Falha ao forjar o Selo Imperial:", erro);
  }
}
//Criar novas missões diárias
async function prepararNovaMissao() {
  const nome = document.getElementById("nova-missao-nome").value;
  const atributo = document.getElementById("nova-missao-atributo").value;
  const nomeUsuario = imperador.nome || localStorage.getItem("usuario_shadow");

  if (!nome || !atributo) {
    alert(
      "O Sistema rejeita missões incompletas! Dê um nome e escolha um atributo.",
    );
    return;
  }

  const missaoExistente = (imperador.missoesAtivas || []).find(
    (m) => m.atributo === atributo,
  );
  if (missaoExistente) {
    if (missaoExistente.concluida) {
      alert(
        `O atributo ${atributo} já foi treinado hoje. O descanso é parte da força!`,
      );
      return;
    }

    if (imperador.substituicoesHoje >= 1) {
      alert("Você já usou sua manobra de substituição diária.");
      return;
    }

    const confirmar = confirm(
      `Já existe uma missão de ${atributo}. Deseja usar sua única substituição diária?`,
    );
    if (!confirmar) return;

    enviarNovaMissao(nome, atributo, true);
  } else {
    enviarNovaMissao(nome, atributo, false);
  }

  const xpGanho = 50;
  const ouroGanho = 15;

  console.log(
    `Preparando para enviar: ${nome} | Atributo: ${atributo} | Usuário: ${nomeUsuario}`,
  );
  alert(`Missão '${nome}' forjada! Preparando envio para o servidor...`);

  async function enviarNovaMissao(nome, atributo, ehSubstituicao) {
    const nomeUsuario =
      imperador.nome || localStorage.getItem("usuario_shadow");

    try {
      const resposta = await fetch("http://localhost:5000/forjar_missao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nomeUsuario,
          nome: nome,
          atributo: atributo,
          substituicao: ehSubstituicao,
        }),
      });

      const resultado = await resposta.json();
      if (resposta.ok) {
        console.log(resultado.mensagem);
        document.getElementById("nova-missao-nome").value = "";
        carregarMissoesDiarias();
        alert(resultado.mensagem);
      } else {
        alert("Falha do Sistema: " + resultado.mensagem);
      }
    } catch (erro) {
      console.error("Erro na comunicação:", erro);
    }
  }
}

async function carregarMissoesDiarias() {
  const nomeUsuario = imperador.nome || localStorage.getItem("usuario_shadow");

  try {
      const resposta = await fetch(`http://localhost:5000/missoes_ativas?username=${nomeUsuario}`);    if (resposta.ok) {
      const missoes = await resposta.json();

      //  Salva as missões na memória do Imperador! (Isso resolve aquele erro do .find definitivamente)
      imperador.missoesAtivas = missoes;

      renderizarMissoesNaTela(missoes);
    }
  } catch (erro) {
    console.error("A interferência bloqueou a visão das missões:", erro);
  }
}

function renderizarMissoesNaTela(missoes) {
    const container = document.getElementById("lista-missoes-dinamica");
    if (!container) return;

    container.innerHTML = ""; 

    missoes.forEach((missao) => {
        const div = document.createElement("div");
        div.className = "quest-card";

        const nivelAtual = imperador.nivel || 1;
        let multiplicador = Math.max(1, Math.floor(Math.pow(nivelAtual, 1.2)));
        let xpReal = missao.xp * multiplicador;
        let ouroReal = missao.ouro * multiplicador;

        // 2. Definição Visual (Cores e Ícones)
        let corAtributo = "#ffffff";
        let icone = '<i class="fa-solid fa-star"></i>';

        if (missao.atributo === "Força") { corAtributo = "#ff4d4d"; icone = '<i class="fa-solid fa-dumbbell"></i>'; }
        if (missao.atributo === "Agilidade") { corAtributo = "#ffd700"; icone = '<i class="fa-solid fa-bolt"></i>'; }
        if (missao.atributo === "Inteligência") { corAtributo = "#b366ff"; icone = '<i class="fa-solid fa-brain"></i>'; }
        if (missao.atributo === "Vitalidade") { corAtributo = "#00ffcc"; icone = '<i class="fa-solid fa-heart-pulse"></i>'; }

        // 3. Verificação de Estado (O Segredo do Botão Cinza)
        const estaConcluida = missao.concluida === 1 || missao.concluida === true;
        const textoBotao = estaConcluida ? "CONCLUÍDA" : "COMPLETAR";
        const classeBotao = estaConcluida ? "btn-missao-concluida" : "btn-complete";
        const atributoDisabled = estaConcluida ? "disabled" : "";

        div.innerHTML = `
            <div class="quest-info">
                <span class="quest-attr" style="color: ${corAtributo}">${icone} [${missao.atributo}]</span>
                <h3 class="quest-name">${missao.nome}</h3>
                <p class="quest-reward">${xpReal} XP | ${ouroReal} Ouro | +1 ${missao.atributo}</p>
            </div>
            <button class="${classeBotao}" ${atributoDisabled} 
                    onclick="completarMissaoDinamica(${missao.id}, '${missao.atributo}')">
                ${textoBotao}
            </button>
        `;
        container.appendChild(div);
    });
}

async function adicionarProgressoConquista(codigo, valor) {
    const token = localStorage.getItem("selo_imperial");
    const usuario = localStorage.getItem("usuario_shadow");

    if (!token || !usuario) return;

    try {
        const resposta = await fetch("http://localhost:5000/atualizar_conquista", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                username: usuario,
                codigo_conquista: codigo,
                progresso_adicional: valor
            })
        });

        if (resposta.ok) {
            console.log(`Progresso registrado na conquista: ${codigo}`);
            carregarConquistasDoBanco(); 
        }
    } catch (erro) {
        console.error("Falha ao registrar conquista:", erro);
    }
}

async function carregarConquistasDoBanco() {
    const token = localStorage.getItem("selo_imperial");
    const usuario = localStorage.getItem("usuario_shadow");
    
    if (!usuario) return;

    try {
        // Altere a rota de acordo com o que você criou no Python para buscar conquistas
        // Exemplo: /listar_conquistas?username=Thawan
        const resposta = await fetch(`http://localhost:5000/listar_conquistas?username=${usuario}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (resposta.ok) {
            const conquistas = await resposta.json();
            renderizarConquistasNaTela(conquistas);
        }
    } catch (erro) {
        console.error("Erro ao ler conquistas do Monólito", erro);
    }
}

function renderizarConquistasNaTela(conquistas) {
    const container = document.getElementById("container-conquistas"); 
    if (!container) return;

    if (conquistas.length === 0) {
        container.innerHTML = "<p>O histórico de batalhas está vazio.</p>";
        return;
    }

    container.innerHTML = "";

    conquistas.forEach(conq => {
        const porcentagem = Math.min(100, Math.floor((conq.progresso / conq.objetivo) * 100));
        const corBarra = conq.concluida ? "#00ffcc" : "#ff4d4d"; 

        const div = document.createElement("div");
        div.className = "conquista-card";
        div.innerHTML = `
            <h4>${conq.nome_visual}</h4>
            <div class="barra-progresso-bg" style="background: #222; height: 10px; width: 100%; margin-top: 5px;">
                <div class="barra-progresso-fill" style="background: ${corBarra}; height: 100%; width: ${porcentagem}%;"></div>
            </div>
            <span style="font-size: 12px; color: #aaa;">${conq.progresso} / ${conq.objetivo}</span>
        `;
        container.appendChild(div);
    });
}

async function verificarDesbloqueioDeTitulos() {
  try {
    const resposta = await fetch("http://localhost:5000/carregar_conquistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: imperador.nome }),
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      let salvamentoNecessario = false;

      // Dicionário mapeando: 'codigo_da_conquista' -> 'Nome do Título'
      const mapaTitulos = {
        carniceiro_portais: "Exterminador",
        matador_deuses: "Matador de Deuses",
        riqueza_eterna: "Mercador de Almas",
        monarca_supremo: "Monarca Soberano",
        carrasco_elites: "Farmador de Aura",
        soberano_masmorra: "Soberano da Masmorra",
        capitalista_arcano: "Capitalista Arcano",
        o_virtuoso: "O Virtuoso",
        mente_inabalavel: "Caminho dos Dois Céus",
        esforco_incansavel: "Prodígio",
        erudito_sombras: "Sábio das Sombras",
      };

      dados.conquistas.forEach((conq) => {
        if (conq.concluida) {
          const tituloRecompensa = mapaTitulos[conq.codigo];

          if (
            tituloRecompensa &&
            !imperador.titulosDesbloqueados.includes(tituloRecompensa)
          ) {
            imperador.titulosDesbloqueados.push(tituloRecompensa);
            salvamentoNecessario = true;

            registrarLog(
              ` CONQUISTA ALCANÇADA: ${conq.nome_visual}! Você desbloqueou o título: [${tituloRecompensa}]!`,
            );
          }
        }
      });

      if (salvamentoNecessario) {
        imperador.salvarEstado();
        atualizarListaTitulos();
      }
    }
  } catch (erro) {
    console.error("Erro ao verificar desbloqueio de títulos:", erro);
  }
}
window.multiplicadorDolar = 1.0;
//API DO DINHEIRO
async function invocarOraculo() {
  try {
    let resposta = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL,BTC-BRL",
    );
    let dados = await resposta.json();
    let valorDolarRaw = parseFloat(dados.USDBRL.bid);
    let valorDolar = parseFloat(dados.USDBRL.bid).toFixed(2);
    let valorBitcoin = parseFloat(dados.BTCBRL.bid).toLocaleString("pt-BR");

    window.multiplicadorDolar = valorDolarRaw / 5.0; // Exemplo de uso do valor do dólar para influenciar o jogo

    document.getElementById("cotacao-dolar").innerText = `R$ ${valorDolar}`;
    document.getElementById("cotacao-bitcoin").innerText = `R$ ${valorBitcoin}`;
  } catch (erro) {
    console.log("A conexão com o Oráculo falhou:", erro);
    document.getElementById("cotacao-dolar").innerText = "Offline";
    document.getElementById("cotacao-bitcoin").innerText = "Offline";
    window.multiplicadorDolar = 1.0; // Valor padrão caso o Oráculo esteja offline
    await carregarLojaDoBanco();
  }
}
//API DAS FRASES
async function invocarMeteorologia() {
  try {
    let respostaOriginal = await fetch("https://dummyjson.com/quotes/random");
    let dadosOriginais = await respostaOriginal.json();
    let fraseIngles = dadosOriginais.quote;
    let autor = dadosOriginais.author;
    let textoParaTraduzir = encodeURIComponent(fraseIngles);
    let urlTradutor = `https://api.mymemory.translated.net/get?q=${textoParaTraduzir}&langpair=en|pt-br`;
    let respostaTraducao = await fetch(urlTradutor);
    let dadosTraducao = await respostaTraducao.json();
    let fraseEmPortugues = dadosTraducao.responseData.translatedText;

    document.getElementById("frase-diaria").innerText = `"${fraseEmPortugues}"`;
    document.getElementById("autor-frase").innerText = `- ${autor}`;
  } catch (erro) {
    console.log("A interferência bloqueou a mensagem externa:", erro);
    // Se a API falhar, exibe uma mensagem predefinida
    document.getElementById("frase-diaria").innerText =
      '"Você acredita no impossível? No momento que as pessoas acreditam que as coisas são impossíveis elas são programadas a desistir."';
    document.getElementById("autor-frase").innerText = "- Michael Kaiser";
  }
}

// carregamundo
async function carregarMundo() {
  const token = localStorage.getItem("selo_imperial");
    const usuario = localStorage.getItem("usuario_shadow");
    if (!token || !usuario) {
        return;
    }
  try {
    let resposta = await fetch("http://localhost:5000/carregar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        username: localStorage.getItem("usuario_shadow"),
      }),
    });
    if (resposta.status === 401 || resposta.status === 404 || !resposta.ok) {
            console.warn("Selo Imperial revogado ou Banco apagado. Redirecionando...");
            localStorage.clear(); // Destrói a memória falsa do navegador
            return; // Para a execução do código aqui
        }

    let dadosBanco = await resposta.json();
    if (dadosBanco && !dadosBanco.erro) {
      console.log(`Resgatando do Monólito SQLite (Nvl ${dadosBanco.nivel}).`);
      imperador = new Monarca(dadosBanco.username);

      imperador.nivel = dadosBanco.nivel;
      imperador.ouro = dadosBanco.ouro;
      imperador.xp = dadosBanco.xp;
      imperador.tituloEquipado = dadosBanco.titulo_equipado || "O mais fraco";
      imperador.titulosDesbloqueados = dadosBanco.titulos || ["Iniciante"];

      const infoTitulo = bancoTitulos[imperador.tituloEquipado];
      if (infoTitulo) {
        const descEl = document.getElementById("titulo-desc");
        if (descEl) descEl.innerText = `Efeito: ${infoTitulo.desc}`;
      }
      atualizarListaTitulos();

      imperador.atributos.forca = dadosBanco.forca || 1;
      imperador.atributos.agilidade = dadosBanco.agilidade || 1;
      imperador.atributos.inteligencia = dadosBanco.inteligencia || 1;
      imperador.atributos.vitalidade = dadosBanco.vitalidade || 1;

      if (dadosBanco.data_ultima_diaria) {
        imperador.ultimoAcesso = dadosBanco.data_ultima_diaria;
      }
      imperador.statusPunicao = dadosBanco.status_punicao !== undefined ? dadosBanco.status_punicao : 0;
      if (dadosBanco.inventario) {
        try {
          let saco = dadosBanco.inventario;
          while (typeof saco === "string") {
            saco = JSON.parse(saco);
          }
          imperador.inventario = Array.isArray(saco) ? saco : [];
        } catch (e) {
          console.error("Erro ao decifrar a bolsa do Monólito:", e);
          imperador.inventario = [];
        }
      }

      let memoriaLocal = JSON.parse(localStorage.getItem("memoria_imperador"));
      let dataDeHoje = new Date().toLocaleDateString();

      if (memoriaLocal) {
        imperador.equipamentos = memoriaLocal.equipamentos || {
          arma: null,
          escudo: null,
          armadura: null,
          acessorio: null,
        };
        imperador.atributosBonus = memoriaLocal.atributosBonus || {
          forca: 0,
          inteligencia: 0,
          agilidade: 0,
          vitalidade: 0,
        };
        let ultimaDataSalva = memoriaLocal.ultimoAcesso || dataDeHoje;

        if (ultimaDataSalva === dataDeHoje) {
          imperador.missoesConcluidas = memoriaLocal.missoesConcluidas || [];
          imperador.ultimoAcesso = ultimaDataSalva;
          imperador.hpAtual =
            memoriaLocal.hpAtual !== undefined
              ? memoriaLocal.hpAtual
              : imperador.hpMaximo;
          imperador.mpAtual =
            memoriaLocal.mpAtual !== undefined
              ? memoriaLocal.mpAtual
              : imperador.mpMaximo;
        } else {
          console.log("A aurora de um novo dia! Missões resetadas, Imperador.");
          imperador.missoesConcluidas = [];
          imperador.ultimoAcesso = dataDeHoje;
          imperador.hpAtual = imperador.hpMaximo;
          imperador.mpAtual = imperador.mpMaximo;
          imperador.salvarEstado();
        }
      } else {
        imperador.ultimoAcesso = dataDeHoje;
      }

      imperador.xpNecessario = 100;
      for (let i = 1; i < imperador.nivel; i++) {
        imperador.xpNecessario = Math.floor(imperador.xpNecessario * 1.5);
      }

      verificarStatusPunicao(dadosBanco);
    } else {
      console.log("Um novo Monarca surge.");
      imperador = new Monarca("Novo Monarca");
    }
  } catch (erro) {
    console.warn("Servidor Python offline. Inicializando vazio.", erro);
    imperador = new Monarca("Convidado");
  }

  atualizarTela();
  renderizarInventario();
  invocarOraculo();
  invocarMeteorologia();
  carregarMissoesDiarias();
  renderizarMural();
  forjarSeloImperial();
}

carregarMundo();
