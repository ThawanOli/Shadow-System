from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import hashlib

app = Flask(__name__)
# O CORS permite que o seu index.html converse com este servidor Python
CORS(app) 
#  ROTAS DA API (A Ponte de Comunicação)
CHAVE_SECRETA = "SENHA_ULTRA_SECRETA_DO_IMPERADOR"

# ROTA 0: LOGIN e CADASTRO
@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    username = dados.get('username')
    senha = dados.get('senha')

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE username = ? AND senha = ?", (username, senha))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"status": "sucesso", "mensagem": "Bem-vindo, Imperador!", "dados": {
            "username": user[0], "nivel": user[2], "xp": user[3], "ouro": user[4]
        }})
    else:
        return jsonify({"status": "erro", "mensagem": "Credenciais inválidas!"}), 401

@app.route('/cadastrar', methods=['POST'])
def cadastrar():
    dados = request.json
    username = dados.get('username')
    senha = dados.get('senha')

    try:
        conn = sqlite3.connect('shadow_system.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO usuarios (username, senha, nivel, xp, ouro) VALUES (?, ?, 1, 0, 100)", (username, senha))
        conn.commit()
        conn.close()
        return jsonify({"status": "sucesso", "mensagem": "Usuário criado com glória!"})
    except sqlite3.IntegrityError:
        return jsonify({"status": "erro", "mensagem": "Este nome já foi reivindicado!"}), 400
    
# ROTA 1: O JavaScript chama esta rota para GRAVAR no banco
@app.route('/salvar', methods=['POST'])
def salvar_estado():
    dados_json = request.json
    lacre_recebido = request.headers.get('X-Lacre-Integridade')
    
# Verifica o lacre de integridade
    # Force a conversão para string simples, sem espaços entre os valores
    mensagem = str(dados_json['nivel']) + str(dados_json['ouro']) + str(dados_json['xp']) + CHAVE_SECRETA
    lacre_servidor = hashlib.sha256(mensagem.encode()).hexdigest()
    # Se o lacre recebido for diferente do lacre gerado, significa que os dados foram corrompidos ou adulterados
    if lacre_recebido != lacre_servidor:
        print("TENTATIVA DE TRAPAÇA DETECTADA!")
        return jsonify({"erro": "Integridade violada!"}), 403
    try:
        conn = sqlite3.connect('shadow_system.db')
        cursor = conn.cursor()
    
        #Converte o JSON recebido em string para salvar no banco
        dados_string = json.dumps(dados_json)
        # Atualiza o Slot 1 com o novo estado do Monarca
        cursor.execute('UPDATE saves SET dados = ? WHERE id = 1', (dados_string,))
    
        conn.commit()
        conn.close()
        print(f" Save do Imperador (Nvl {dados_json['nivel']}) sincronizado com o Monólito.")
        return jsonify({"mensagem": "Sincronização com o Monólito de Dados concluída."})
    except Exception as e:
        print(f"Erro ao salvar no banco: {e}")
        return jsonify({"erro": "Falha ao salvar os dados."}), 500
    
# ROTA 2: O JavaScript chama esta rota ao iniciar o jogo para LER do banco
@app.route('/carregar', methods=['GET'])
def carregar_estado():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT dados FROM saves WHERE id = 1')
    save_string = cursor.fetchone()[0]
    conn.close()
    
    # Devolve o JSON puro para o JavaScript montar o Imperador
    return jsonify(json.loads(save_string))

@app.route('/loja', methods=['GET'])
def buscar_loja():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    # Busca todos os itens da tabela loja
    cursor.execute('SELECT id, nome, preco, descricao, tipo FROM loja')
    itens = cursor.fetchall()
    conn.close()

    # Transforma a lista de tupla em lista de dicionario, ai o JS entende
    loja_formatada = [
        {
            "id": i[0],
            "nome": i[1], 
            "preco": i[2], 
            "descricao": i[3], 
            "tipo": i[4]
        } for i in itens
    ]
    return jsonify(loja_formatada)
#  ROTA 3 COMPRAS
@app.route('/comprar', methods=['POST'])
def comprar_item():
    dados = request.json
    id_item = dados.get('id_item')
    username = dados.get('username')

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    # 1. Busca o item e o usuário
    cursor.execute('SELECT nome, preco FROM loja WHERE id = ?', (id_item,))
    item = cursor.fetchone()
    cursor.execute('SELECT ouro, nivel, xp FROM usuarios WHERE username = ?', (username,))
    user_data = cursor.fetchone()

    if not item or not user_data:
        conn.close()
        return jsonify({"mensagem": "Item ou Usuário não encontrado!"}), 404

    # 2. Verifica saldo real no banco
    if user_data[0] < item[1]:
        conn.close()
        return jsonify({"mensagem": "Tu ta passando fome Imperador, farme mais!"}), 400

    # 3. Processa a compra
    novo_ouro = user_data[0] - item[1]
    cursor.execute('UPDATE usuarios SET ouro = ? WHERE username = ?', (novo_ouro, username))
    cursor.execute('INSERT INTO inventario (username, id_item) VALUES (?, ?)', (username, id_item))
    
    # Gera o novo Hash para segurança
    import json
    import hashlib
    dados_hash = {"nivel": user_data[1], "ouro": novo_ouro, "xp": user_data[2]}
    conteudo_json = json.dumps(dados_hash, sort_keys=True)
    novo_hash = hashlib.sha256(conteudo_json.encode()).hexdigest()

    conn.commit()
    conn.close()

    return jsonify({
        "status": "sucesso",
        "novo_ouro": novo_ouro,
        "item_nome": item[0],
        "novo_hash": novo_hash
    }), 200

# ROTA 4 COMPLETAR MISSÃO
@app.route('/completar_missao', methods=['POST'])
def completar_missao():
    dados = request.json
    username = dados.get('username')
    xp_ganho = dados.get('xp')
    ouro_ganho = dados.get('ouro')
    atributo = dados.get('atributo')

    if not username:
        return jsonify({"mensagem": "Nome de usuario ausente!"}), 400
    
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    # Atualiza Ouro e XP (E o atributo se a coluna existir no seu SQL)
    try:
        query = f"UPDATE usuarios SET xp = xp + ?, ouro = ouro + ?, {atributo} = {atributo} + 1 WHERE username = ?"
        cursor.execute(query, (xp_ganho, ouro_ganho, username))
        conn.commit()
        
        cursor.execute('SELECT xp, ouro FROM usuarios WHERE username = ?', (username,))
        atualizado = cursor.fetchone()
        if atualizado is None:
            conn.close()
            return jsonify({"mensagem": "Usuario nao encontrado no banco"}), 404

        # Se o código passar daqui, o Python garante que 'atualizado' tem dados.
        novo_xp = atualizado[0]
        novo_ouro = atualizado[1]
        conn.close()
        return jsonify({"status": "sucesso", "xp": novo_xp, "ouro": novo_ouro}), 200
    except Exception as e:
        conn.close()
        return jsonify({"mensagem": f"Erro no banco: {str(e)}"}), 500

# DESPERTAR DO SISTEMA

def iniciar_banco():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    #  Criação das tabelas 
    cursor.execute(
        'CREATE TABLE IF NOT EXISTS usuarios ('
            'username TEXT PRIMARY KEY, '
            'senha TEXT NOT NULL, '
            'nivel INTEGER DEFAULT 1, '
            'xp INTEGER DEFAULT 0, '
            'ouro INTEGER DEFAULT 100, '
            'forca INTEGER DEFAULT 1, '          
            'agilidade INTEGER DEFAULT 1, '      
            'inteligencia INTEGER DEFAULT 1, '   
            'vitalidade INTEGER DEFAULT 1, '  
            'hash_seguranca TEXT)')
    
    cursor.execute(
        'CREATE TABLE IF NOT EXISTS saves (' 
            'id INTEGER PRIMARY KEY, ' 
            'nome TEXT, ' 
            'dados TEXT)')
    
    cursor.execute(
        'CREATE TABLE IF NOT EXISTS loja (' 
            'id INTEGER PRIMARY KEY, ' 
            'nome TEXT, ' 
            'preco INTEGER, ' 
            'descricao TEXT, ' 
            'tipo TEXT)')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventario (
            username TEXT,
            id_item INTEGER,
            FOREIGN KEY(username) REFERENCES usuarios(username),
            FOREIGN KEY(id_item) REFERENCES loja(id)
        )
    ''')
    #  Popular a loja se estiver vazia
    cursor.execute('SELECT COUNT(*) FROM loja')
    if cursor.fetchone()[0] == 0:
        itens = [
           # Armas e Defesa
            (1, 'Espada Curta de Knight', 500, '+5 de Força', 'arma'),
            (2, 'Escudo de Madeira', 400, '+4 de Defesa', 'armadura'),
            (3, 'Armadura de Couro de Sombra', 1200, '+10 de Defesa', 'armadura'),
            (5, 'Adaga Enferrujada', 100, '+2 de Agilidade (Ataque Rápido)', 'arma'),
            
            # Consumíveis (Efeitos Distintos)
            (4, 'Poção de Cura (P)', 30, 'Recupera 30 de HP', 'pocao'),
            (6, 'Poção de Vitalidade', 150, 'Recupera 100 de HP + Buff de Resistência', 'pocao'),
            
            # Utilitários e Mágicos
            (7, 'Anel de Mana', 800, '+20 de Energia Estelar (MP)', 'acessorio'),
            (8, 'Pergaminho de Retorno', 200, 'Fuga segura de dungeons', 'item')
        ]
        cursor.executemany('INSERT INTO loja VALUES (?, ?, ?, ?, ?)', itens)

    #  Garante que tenha um slot inicial
    cursor.execute('SELECT id FROM saves WHERE id = 1')
    if not cursor.fetchone():
        cursor.execute('INSERT INTO saves (id, nome, dados) VALUES (1, "Thawan Oliveira", "{}")')

    conn.commit()
    conn.close()
    print(" Monólito e Mercado sincronizados com sucesso!")


if __name__ == '__main__':
    iniciar_banco() 
    print(" O Cérebro Central (Backend) despertou na porta 5000!")
    app.run(debug=True, port=5000)
