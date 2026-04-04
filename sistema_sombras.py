import json
import os

# Primeira versão do sistema de progressão inspirado em jogos de RPG, com foco em missões diárias, 
# XP e evolução de atributos. O código é estruturado para ser facilmente expandido com novas funcionalidades, como mais tipos de missões, 
# inimigos e itens.
class Player:
    def __init__(self,nome):
        self.nome = nome
        self.nivel = 1
        self.xp_atual = 0
        self.xp_necessario = 100  #XP para chegar ao lvl 2
        self.hp = 100

        #1. ÁRVORE DE ATRIBUTOS (Dicionário)
        self.atributos = {
            "Força": 1,
            "Inteligência": 1,
            "Agilidade": 1,
            "Vitalidade":1
        }

        self.arquivo_save = "save_imperador.json" 
        self.carregar()   

    def exibir_status(self):
        print("\n" + "="*30)
        print(f"🗡️  JANELA DE STATUS  🗡️")
        print("="*30) 
        print(f"Nome: {self.nome}")
        print(f"Nível: {self.nivel}")
        print(f"XP: {self.xp_atual} / {self.xp_necessario}")
        print(f"HP: {self.hp} / 100")
        print("="*30 + "\n")
        print("📊 ÁRVORE DE ATRIBUTOS:")
        
        for atributo, valor in self.atributos.items():
            print (f" > {atributo}: {valor}")
        print ("="*30 + "\n")

    def ganhar_xp(self, quantidade):
        print(f"[SISTEMA] Você ganhou {quantidade} de XP!")
        self.xp_atual += quantidade

        #Lógica de lvl up
        if self.xp_atual >= self.xp_necessario:
            self.subir_de_nivel()

        #Salva o progresso sempre que ganha XP
        self.salvar()
    
    def subir_de_nivel(self):
        self.nivel += 1
        self.xp_atual -= self.xp_necessario #Guarda o exp que sobrou
        self.xp_necessario = int(self.xp_necessario * 1.5) #O próximo nível fica mais difícil
        self.hp = 100 #Restaura o HP ao subir de nível
        
        # Bonus de subida de nível em todos os atributos
        for atributo in self.atributos:
            self.atributos[atributo] += 2

        print("\n" + "🌟"*15)
        print(f"    LEVEL UP! VOCÊ ATINGIU O NÍVEL {self.nivel}!")
        print("🌟"*15 + "\n")
    
    def salvar(self):
        # Transforma os atributos do jogador em um dicionário
        dados = {
            "nome": self.nome,
            "nivel": self.nivel,
            "xp_atual": self.xp_atual,
            "xp_necessario": self.xp_necessario,
            "hp": self.hp,
            "atributos": self.atributos 
        }
        # Escreve esse dicionário no arquivo JSON
        with open(self.arquivo_save, 'w') as arquivo:
            json.dump(dados, arquivo, indent=4)
        
    def carregar(self):
        # Verifica se o arquivo de save já existe
        if os.path.exists(self.arquivo_save):
            with open(self.arquivo_save, 'r') as arquivo:
                dados = json.load(arquivo)
                # Atualiza os atributos com os dados salvos
                self.nome = dados.get("nome", self.nome)
                self.nivel = dados.get("nivel", 1)
                self.xp_atual = dados.get("xp_atual", 0)
                self.xp_necessario = dados.get("xp_necessario", 100)
                self.hp = dados.get("hp", 100)
                # Recupera os atributos salvos, se existirem
                self.atributos = dados.get("atributos", self.atributos)
            print(f"[SISTEMA] Bem-vindo de volta, Imperador. Status e Atributos recuperados com sucesso.")
        else:
            print(f"[SISTEMA] Novo Jogador detectado. Iniciando os registros nas sombras.")

class Missao:
    #Adicionei 'atributo-alvo' para saber o que a missão treina
    def __init__(self, titulo, rank, xp_recompensa, atributo_alvo):
        self.titulo = titulo
        self.rank = rank #Rank pode ser E, D, C, B, A, S, SS, SSS
        self.xp_recompensa = xp_recompensa
        self.atributo_alvo = atributo_alvo
        self.concluida = False # Toda missão nasce incompleta

    def exibir_detalhes(self):
        status = "✅ Concluída" if self.concluida else "⏳ Pendente"
        print(f"[{self.rank}] {self.titulo} - Recompensa: {self.xp_recompensa} XP | Evolui: {self.atributo_alvo} | Status: {status}")

    def completar(self, player):
        if not self.concluida:
            print(f"\n[SISTEMA] Validando conclusão da missão...")
            self.concluida = True
            print(f"\n[SISTEMA] Missão de Rank {self.rank} '{self.titulo}' finalizada com sucesso!")
           # O jogador recebe o XP
            player.ganhar_xp(self.xp_recompensa)
            # A missão sobe o atributo especifico
            player.atributos[self.atributo_alvo] += 1
            print(f"[SISTEMA] O seu atributo '{self.atributo_alvo}' subiu +1 ponto!")
            
            player.salvar() # Salva o progresso
        else:
            print(f"\n[AVISO] A missão '{self.titulo}' já foi resgatada, Imperador.")

def salvar_missoes(Lista_missoes):
    # Esta função salva a lista de missões em um arquivo JSON
    dados_missoes = []
    for missao in Lista_missoes:
        dados_missoes.append({
            "titulo": missao.titulo,
            "rank": missao.rank,
            "xp_recompensa": missao.xp_recompensa,
            "atributo_alvo": missao.atributo_alvo,
            "concluida": missao.concluida
        })
    with open("missoes.json", 'w') as arquivo:
        json.dump(dados_missoes, arquivo, indent=4)

def carregar_missoes():
    # Esta função carrega as missões do arquivo JSON e retorna uma lista de objetos Missao
    if os.path.exists("missoes.json"):
        with open("missoes.json", 'r') as arquivo:
            dados_missoes = json.load(arquivo)
            lista_missoes = []
            for dados in dados_missoes:
                missao = Missao(
                    titulo=dados["titulo"],
                    rank=dados["rank"],
                    xp_recompensa=dados["xp_recompensa"],
                    atributo_alvo=dados["atributo_alvo"]
                )
                missao.concluida = dados["concluida"]
                lista_missoes.append(missao)
            return lista_missoes
    else:
        # Se for a primeira vez, cria as missões padrão
        return [
            Missao("Treino de Força (Ectomorfo em Casa)", "C", 40, "Força"),
            Missao("Revisão de Vocabulário", "D", 25, "Inteligência"),
            Missao("Avançar no projeto de Python", "B", 60, "Inteligência")
        ] 
    
#--- O CORAÇÃO DO SISTEMA (MENU INTERATIVO)
def menu_principal():
    print("\n" + "="*40)
    print(" INICIANDO O SHADOW SYSTEM: ARISE ")
    print("="*40)

# 1. Invocando o jogador
imperador = Player("Imperador das Rosas Azuis")

# 2. O Sistema gera as Quests Diárias
missoes_disponiveis = [
    Missao("Treino de Força (Ectomorfo em Casa)", "C", 40, "Força"),
    Missao("Revisão de Vocabulário", "D", 25, "Inteligência"),
    Missao("Avançar no projeto de Python", "B", 60, "Inteligência")
]
# 3. O Loop Infinito (O jogo fica rodando aqui dentro)
while True:
    print("\n" + "="*40)
    print("👁️  MENU PRINCIPAL  👁️")
    print("="*40)
    print("1 - Ver Janela de Status")
    print("2 - Ver Quadro de Missões")
    print("3 - Completar uma Missão")
    print("4 - Adicionar Nova Missão ao Sistema")
    print("0 - Desligar Sistema")
    print("="*40)
        
    escolha = input("Comando: ")

    if escolha == '1':
        imperador.exibir_status()

    elif escolha == '2':
        print("\n📜 QUEST LOG (MISSÕES DISPONÍVEIS):")
        # O enumerate cria um número para cada missão (0, 1, 2...)
        for i, missao in enumerate(missoes_disponiveis):
            print(f"[{i}] ", end="")
            missao.exibir_detalhes()

    elif escolha == '3':
        print("\nQual missão você deseja reportar como concluída?")
        for i, missao in enumerate(missoes_disponiveis):
           if not missao.concluida:
                print(f"[{i}] {missao.titulo}")
            
        try:
            num_missao = int(input("Digite o número da missão: "))
            # Verifica se o número digitado existe na lista
            if 0 <= num_missao < len(missoes_disponiveis):
                missoes_disponiveis[num_missao].completar(imperador)
            else:
                print("[AVISO] O Sistema não encontrou essa missão.")
        except ValueError:
            print("[AVISO] Comando inválido. Digite apenas o número.")

    elif escolha == '4':
        # Lógica para adicionar uma nova missão
        print ("\n--- FORJAR NOVA MISSÃO ---")
        novo_titulo = input("Titulo da Missão: ")
        novo_rank = input("Rank (E, D, C, B, A, S, SS, SSS): ")

        try:
            novo_xp = int(input("XP de Recompensa (ex: 50): "))
            print("Qual atributo esta missão vai treinar?")
            print("1 - Força | 2 - Inteligência | 3 - Agilidade | 4 - Vitalidade")
            escolha_atr = input("Escolha o número (1-4): ")

            # Mapeia a escolha para o nome correto do atributo
            mapa_atributos = {'1': 'Força', '2': 'Inteligência', '3': 'Agilidade', '4': 'Vitalidade'}
            atributo_escolhido = mapa_atributos.get(escolha_atr, 'Força') #Padrão é Força caso digite errado

            # Cria a missão e adiciona na Lista
            nova_missao = Missao(novo_titulo, novo_rank.upper(), novo_xp, atributo_escolhido)
            missoes_disponiveis.append(nova_missao)

            # Salva a nova missão no arquivo JSON
            salvar_missoes(missoes_disponiveis)

            print(f"\n[SISTEMA] Missão '{novo_titulo}' adicionada com sucesso ao Quadro!")
        except ValueError:
            print("[ERRO] O XP deve ser um número inteiro. Criação cancelada.")

    elif escolha == '0':
        print("\n[SISTEMA] Salvando progresso nas sombras. Retorne em breve, Monarca.")
        break # Este comando "quebra" o ciclo infinito e fecha o programa

    else:
       print("\n[ERRO] Comando não reconhecido. Tente novamente.")

# O gatilho que faz o programa começar
if __name__ == "__main__":
    menu_principal()