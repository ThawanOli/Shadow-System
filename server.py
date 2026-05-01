from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import hashlib
from datetime import datetime

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

    if user:
        cursor.execute("SELECT data_ultima_diaria, status_punicao FROM usuarios WHERE username = ?", (username,))
        dados_extra = cursor.fetchone()
        
        data_salva = dados_extra[0] if dados_extra and dados_extra[0] else ""
        status_punicao = dados_extra[1] if dados_extra else 0

        hoje = datetime.now().strftime('%Y-%m-%d')

        if data_salva != hoje:
            cursor.execute("UPDATE usuarios SET status_punicao = 1 WHERE username = ?", (username,))
            conn.commit()
            status_punicao = 1 

        conn.close() 

        return jsonify({
            "status": "sucesso", 
            "mensagem": "Bem-vindo, Imperador!", 
            "dados": {
                "username": user[0], 
                "nivel": user[2], 
                "xp": user[3], 
                "ouro": user[4],
                "status_punicao": status_punicao 
            }
        })
    else:
        conn.close()
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
    try:
        dados = request.json
        username = dados.get('nome') or dados.get('username')
        
        if not username:
            return jsonify({"erro": "Monarca não identificado"}), 400

        conn = sqlite3.connect('shadow_system.db')
        cursor = conn.cursor()

        cursor.execute('''
            UPDATE usuarios 
            SET nivel = ?, xp = ?, ouro = ?, forca = ?, agilidade = ?, 
                inteligencia = ?, vitalidade = ?, inventario = ?, data_ultima_diaria = ?
            WHERE username = ?
        ''', (
            dados.get('nivel', 1), dados.get('xp', 0), dados.get('ouro', 0),
            dados.get('forca', 10), dados.get('agilidade', 10),
            dados.get('inteligencia', 10), dados.get('vitalidade', 10),
            json.dumps(dados.get('inventario', [])), 
            dados.get('data_ultima_diaria', '2026-04-30'), 
            username
        ))

        conn.commit()
        conn.close()
        return jsonify({"status": "sucesso"})
    except Exception as e:
        print(f"Erro no Monólito: {e}")
        return jsonify({"erro": str(e)}), 500
    
# ROTA 2 CARREGAR
@app.route('/carregar', methods=['POST']) 
def carregar_estado():
    dados = request.json
    username = dados.get('username')

    if not username:
         return jsonify({"erro": "Monarca não identificado"}), 400

    conn = sqlite3.connect('shadow_system.db')
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "username": user["username"],
            "nivel": user["nivel"],
            "xp": user["xp"],
            "ouro": user["ouro"],
            "forca": user["forca"],
            "agilidade": user["agilidade"],
            "inteligencia": user["inteligencia"],
            "vitalidade": user["vitalidade"],
            "status_punicao": user["status_punicao"],
            "data_ultima_diaria": user["data_ultima_diaria"],
            "inventario": user["inventario"]
        })
        
    return jsonify({"erro": "Save não encontrado no Monólito!"}), 404
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
    cursor.execute('SELECT nome, preco FROM loja WHERE id = ?', (int(id_item),))
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
    mensagem = str(user_data[1]) + str(novo_ouro) + str(user_data[2]) + CHAVE_SECRETA
    novo_hash = hashlib.sha256(mensagem.encode()).hexdigest()

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

    atributos_validos = ["forca", "inteligencia", "agilidade", "vitalidade"]
    if atributo not in atributos_validos:
        return jsonify({"mensagem": "Atributo inválido!"}), 400

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    try:
        hoje = datetime.now().strftime('%Y-%m-%d')
        # agora zera a punição e atualiza a data da última diária
        query = f"UPDATE usuarios SET xp = xp + ?, ouro = ouro + ?, {atributo} = {atributo} + 1, status_punicao = 0, data_ultima_diaria = ? WHERE username = ?"
        cursor.execute(query, (xp_ganho, ouro_ganho, hoje, username))
        conn.commit()
        cursor.execute('SELECT nivel, xp, ouro FROM usuarios WHERE username = ?', (username,))
        atualizado = cursor.fetchone()
        
        user_nivel = atualizado[0]
        novo_xp = atualizado[1]
        novo_ouro = atualizado[2]

        mensagem = str(user_nivel) + str(novo_ouro) + str(novo_xp) + CHAVE_SECRETA
        hash_missao = hashlib.sha256(mensagem.encode()).hexdigest()

        conn.close()
        return jsonify({"status": "sucesso", "xp": novo_xp, "ouro": novo_ouro, "novo_hash": hash_missao})
    except Exception as e:
        conn.close()
        return jsonify({"mensagem": str(e)}), 500
    
# ROTA Limpa punicao
@app.route('/limpar_punicao', methods=['POST'])
def limpar_punicao():
    dados = request.json
    username = dados.get('username')
    
    # Grava o dia de hoje, para o Sistema não te punir de novo ao recarregar
    hoje = datetime.now().strftime('%Y-%m-%d')
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    
    # Zera a punição e atualiza a data
    cursor.execute("UPDATE usuarios SET status_punicao = 0, data_ultima_diaria = ? WHERE username = ?", (hoje, username))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "sucesso", "mensagem": "Punição revogada. O Sistema reconhece sua sobrevivência."})

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
            (1, 'Espada Curta do Cavaleiro', 500, '+5 de Força', 'arma'),
            (2, 'Escudo de Madeira', 400, '+4 de Defesa', 'armadura'),
            (3, 'Armadura de Couro de Sombra', 1200, '+10 de Defesa', 'armadura'),
            (5, 'Adaga Enferrujada', 100, '+2 de Agilidade (Ataque Rápido)', 'arma'),
            
            # Consumíveis (Efeitos Distintos)
            (4, 'Poção de Cura (P)', 30, 'Recupera 30 de HP', 'pocao'),
            (9, 'Poção de Cura (M)', 80, 'Recupera 150 de HP', 'pocao'),
            (10, 'Poção de Cura (G)', 200, 'Recupera 500 de HP', 'pocao'),
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
