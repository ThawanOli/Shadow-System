from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
import hashlib
import jwt
import datetime
from functools import wraps

SEGREDO_JWT = "kaiser_shadow_system_super_secreto_2026"

def token_obrigatorio(f):
    @wraps(f)
    def decorador_protegido(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            partes = request.headers['Authorization'].split()
            if len(partes) == 2 and partes[0] == 'Bearer':
                token = partes[1]

        if not token:
            return jsonify({'mensagem': 'Selo Imperial ausente! Os portões estão trancados.'}), 401

        try:
            dados = jwt.decode(token, SEGREDO_JWT, algorithms=['HS256'])
            usuario_validado = dados['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'mensagem': 'O Selo Imperial expirou. Apresente-se novamente ao Monólito.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'mensagem': 'Selo Imperial falsificado! Ataque bloqueado.'}), 401

        return f(usuario_validado, *args, **kwargs)
    return decorador_protegido

app = Flask(__name__)
@app.route('/')
def home():
    return render_template('index.html')
# O CORS permite que o seu index.html converse com este servidor Python
CORS(app) 
#  ROTAS DA API (A Ponte de Comunicação)
CHAVE_SECRETA = "SENHA_ULTRA_SECRETA_DO_IMPERADOR"

# O Catálogo Incorruptível do 
CATALOGO_DO_MONOLITO = {
    1: 500,   # Ex: Espada Curta do Cavaleiro
    2: 400,   # Ex: Escudo de Madeira
    3: 1200,  # Ex: Armadura de Couro de Sombra
    4: 30,    # Ex: Poção de Cura (P)
    5: 100,   # Ex: Adaga Enferrujada
    6: 150,   # Ex: Poção de Vitalidade
    7: 800,   # Ex: Anel de Mana
    8: 200,   # Ex: Pergaminho de Retorno
    9: 80,    # Ex: Poção de Cura (M)
    10: 200,  # Ex: Poção de Cura (G)
    11: 30,    # Ex: Poção de Mana (P)
    12: 80,    # Ex: Poção de Mana (M)
    13: 200    # Ex: Poção de Mana (G)
}
# ROTA SEGURANÇA
@app.route('/autenticar', methods=['POST'])
def autenticar():
    dados = request.get_json()
    username = dados.get('username')

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user:
        token = jwt.encode({
            'username': username,
            'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)
        }, SEGREDO_JWT, algorithm='HS256')
        
        return jsonify({'token': token, 'mensagem': 'Selo Imperial concedido.'}), 200
    
    return jsonify({'mensagem': 'Identidade não reconhecida pelo Monólito!'}), 401

# ROTA 0: LOGIN e CADASTRO
@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    username = dados.get('username')
    senha = dados.get('senha')

    conn = sqlite3.connect('shadow_system.db')
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM usuarios WHERE username = ? AND senha = ?", (username, senha))
    user = cursor.fetchone()

    if user:
        data_salva = user['data_ultima_diaria'] or ""
        status_punicao = user['status_punicao'] or 0
        hoje = datetime.datetime.now().strftime('%Y-%m-%d')

        if data_salva != "" and data_salva != hoje:
            cursor.execute("UPDATE usuarios SET status_punicao = 1 WHERE username = ?", (username,))
            conn.commit()
            status_punicao = 1 

        conn.close() 

        return jsonify({
            "status": "sucesso", 
            "mensagem": "Bem-vindo, Imperador!", 
            "dados": {
                "username": user['username'], 
                "nivel": user['nivel'], 
                "xp": user['xp'], 
                "ouro": user['ouro'],
                "forca": user['forca'],
                "agilidade": user['agilidade'],
                "inteligencia": user['inteligencia'],
                "vitalidade": user['vitalidade'],
                "status_punicao": status_punicao,
                "inventario": user['inventario']
            }
        })
    else:
        conn.close()
        return jsonify({"status": "erro", "mensagem": "Credenciais inválidas!"}), 401
# ROTA DE CADASTRO
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
@token_obrigatorio
def salvar_estado(usuario_validado):
        dados = request.json
        username = usuario_validado
        
        if not username:
            return jsonify({"erro": "Monarca não identificado"}), 400

        conn = sqlite3.connect('shadow_system.db')
        cursor = conn.cursor()

        cursor.execute('''
            UPDATE usuarios 
            SET nivel = ?, xp = ?, ouro = ?, forca = ?, agilidade = ?, 
                inteligencia = ?, vitalidade = ?, inventario = ?, titulo_equipado = ?
            WHERE username = ?
        ''', (
            dados.get('nivel', 1), dados.get('xp', 0), dados.get('ouro', 0),
            dados.get('forca', 10), dados.get('agilidade', 10),
            dados.get('inteligencia', 10), dados.get('vitalidade', 10),
            json.dumps(dados.get('inventario', [])), dados.get('titulo_equipado'),
            usuario_validado
        ))

        conn.commit()
        conn.close()
        return jsonify({"status": "sucesso"})

# ROTA 2 Equipar Título Desbloqueado
@app.route('/equipar_titulo', methods=['POST'])
def equipar_titulo_servidor():
    dados = request.get_json()
    username = dados.get('username')
    titulo = dados.get('titulo')

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET titulo_equipado = ? WHERE username = ?', (titulo, username))
    cursor.execute('SELECT id FROM titulos_desbloqueados WHERE username = ? AND nome_titulo = ?', (username, titulo))
    if not cursor.fetchone():
        cursor.execute('INSERT INTO titulos_desbloqueados (username, nome_titulo) VALUES (?, ?)', (username, titulo))
    
    conn.commit()
    conn.close()
    return jsonify({"status": "sucesso", "titulo": titulo})

# ROTA 3 CARREGAR
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

    if not user:
        conn.close()
        return jsonify({"erro": "Monarca não encontrado no Monólito!"}), 404
    
    cursor.execute('SELECT nome_titulo FROM titulos_desbloqueados WHERE username = ?', (username,))
    titulos = [t['nome_titulo'] for t in cursor.fetchall()]
    if not titulos:
        titulos = ["Iniciante"]
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
            "inventario": user["inventario"],
            "titulo_equipado": user["titulo_equipado"] or "O mais fraco",
            "titulos": titulos
        })
        
    return jsonify({"erro": "Save não encontrado no Monólito!"}), 404

# ROTA 4
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

#  ROTA 5 COMPRAS
@app.route('/comprar', methods=['POST'])
@token_obrigatorio
def comprar_item(usuario_validado):
    dados = request.get_json()
    id_item = dados.get('id_item')
    preco_cobrado = dados.get('preco_dinamico') 
    username = usuario_validado

    if preco_cobrado is None or preco_cobrado < 0:
        return jsonify({"mensagem": "Tentativa de corrupção do sistema! Preço inválido."}), 400

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    cursor.execute('SELECT nome, preco FROM loja WHERE id = ?', (int(id_item),))
    item = cursor.fetchone()
    cursor.execute('SELECT ouro, nivel, xp FROM usuarios WHERE username = ?', (username,))
    user_data = cursor.fetchone()

    if not item or not user_data:
        conn.close()
        return jsonify({"mensagem": "Item ou Usuário não encontrado!"}), 404

    preco_base = item[1]

    limite_minimo = preco_base * 0.5 
    
    if preco_cobrado < limite_minimo:
        conn.close()
        return jsonify({"mensagem": f"Transação negada! O Oráculo detectou uma oscilação irreal ({preco_cobrado}G). O mercado foi manipulado."}), 400

    if user_data[0] < preco_cobrado:
        conn.close()
        return jsonify({"mensagem": "Tu ta passando fome Imperador, farme mais!"}), 400

    novo_ouro = user_data[0] - preco_cobrado
    cursor.execute('UPDATE usuarios SET ouro = ? WHERE username = ?', (novo_ouro, username))
    cursor.execute('INSERT INTO inventario (username, id_item) VALUES (?, ?)', (username, id_item))

    # Gera o Hash para segurança
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

    
# ROTA 6 Limpa punição
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

# ROTA 7 Forjar Missão Diária
@app.route('/forjar_missao', methods=['POST'])
def forjar_missao():
    dados = request.get_json()
    username = dados.get('username')
    nome = dados.get('nome')
    atributo = dados.get('atributo')
    eh_substituicao = dados.get('substituicao', False)

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT concluida, substituicao_usada FROM missoes_diarias 
        WHERE username = ? AND atributo = ? AND data_criacao = CURRENT_DATE
    ''', (username, atributo))
    registro = cursor.fetchone()

    if registro:
        concluida, sub_usada = registro
        if concluida:
            return jsonify({"status": "erro", "mensagem": "Atributo já treinado hoje!"}), 403
        
        if eh_substituicao and sub_usada:
            return jsonify({"status": "erro", "mensagem": "Limite de substituição atingido!"}), 403

        cursor.execute('''
            UPDATE missoes_diarias SET nome_missao = ?, substituicao_usada = 1
            WHERE username = ? AND atributo = ? AND data_criacao = CURRENT_DATE
        ''', (nome, username, atributo))
    else:
        cursor.execute('''
            INSERT INTO missoes_diarias (username, nome_missao, atributo)
            VALUES (?, ?, ?)
        ''', (username, nome, atributo))

    conn.commit()
    conn.close()
    return jsonify({"status": "sucesso", "mensagem": "Sistema atualizado!"})

#  ROTA 8 Buscar missões ativas do usuário
@app.route('/missoes_ativas', methods=['GET'])
def missoes_ativas():
    username = request.args.get('username')
    
    if not username:
        return jsonify({"erro": "Usuário não identificado"}), 400

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, nome_missao, atributo, concluida, substituicao_usada
        FROM missoes_diarias 
        WHERE username = ? AND data_criacao = CURRENT_DATE
    ''', (username,))
    
    missoes_db = cursor.fetchall()
    conn.close()

    # Empacota os dados pra enviar js
    missoes_json = []
    for m in missoes_db:
        missoes_json.append({
            "id": m[0],
            "nome": m[1],
            "atributo": m[2],
            "concluida": bool(m[3]),
            "substituicao_usada": bool(m[4]),
            "xp": 50,    
            "ouro": 15
        })

    return jsonify(missoes_json)

# ROTA 9 Completar missão e resgatar recompensa
@app.route('/completar_missao_dinamica', methods=['POST'])
def completar_missao_dinamica():
    dados = request.get_json()
    missao_id = dados.get('id')
    username = dados.get('username')
    xp_ganho = dados.get('xp')
    ouro_ganho = dados.get('ouro')
    atributo_alvo = dados.get('atributo')

    mapa_colunas = {
        "Força": "forca",
        "Agilidade": "agilidade",
        "Inteligência": "inteligencia",
        "Vitalidade": "vitalidade"
    }
    coluna_db = mapa_colunas.get(atributo_alvo)

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('SELECT concluida FROM missoes_diarias WHERE id = ?', (missao_id,))
    status = cursor.fetchone()

    if status and status[0] == 0:
        cursor.execute('UPDATE missoes_diarias SET concluida = 1 WHERE id = ?', (missao_id,))
        if coluna_db:
            cursor.execute(f'''
                UPDATE usuarios 
                SET xp = xp + ?, ouro = ouro + ?, {coluna_db} = {coluna_db} + 1 
                WHERE username = ?
            ''', (xp_ganho, ouro_ganho, username))
        
        conn.commit()
        conn.close()
        return jsonify({"status": "sucesso", "mensagem": "Recompensa do Império resgatada!"})
    else:
        conn.close()
        return jsonify({"status": "erro", "mensagem": "Missão já concluída ou registro violado."}), 400
    
# ROTA 10 Gerenciar conquistas (Criar, Atualizar Progresso, Ler Status)
@app.route('/conquistas', methods=['POST'])
def gerenciar_conquistas():
    dados = request.get_json()
    username = dados.get('username')
    codigo = dados.get('codigo_conquista') 
    nome = dados.get('nome_visual')        
    novo_progresso = dados.get('progresso', 0)
    objetivo = dados.get('objetivo', 100)
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('SELECT progresso, concluida FROM conquistas WHERE username = ? AND codigo_conquista = ?', (username, codigo))
    registro = cursor.fetchone()

    if registro:
        progresso_db, concluida_db = registro
        
        if novo_progresso > 0 and not concluida_db:
            progresso_final = progresso_db + novo_progresso
            status_concluida = 1 if progresso_final >= objetivo else 0
            
            cursor.execute('''
                UPDATE conquistas 
                SET progresso = ?, concluida = ? 
                WHERE username = ? AND codigo_conquista = ?
            ''', (progresso_final, status_concluida, username, codigo))
            conn.commit()
            
            conn.close()
            return jsonify({"status": "atualizado", "progresso_atual": progresso_final, "concluida": bool(status_concluida)})
        
        conn.close()
        return jsonify({"status": "leitura", "progresso_atual": progresso_db, "concluida": bool(concluida_db)})
        
    else:
        # Cria a conquista se nao existe
        cursor.execute('''
            INSERT INTO conquistas (username, codigo_conquista, nome_visual, progresso, objetivo)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, codigo, nome, novo_progresso, objetivo))
        conn.commit()
        conn.close()
        return jsonify({"status": "criada", "progresso_atual": novo_progresso, "concluida": False})
    
# ROTA 11 Carregar conquistas do usuário para exibir no perfil
@app.route('/carregar_conquistas', methods=['POST'])
def carregar_conquistas_servidor():
    dados = request.get_json()
    username = dados.get('username')

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('SELECT codigo_conquista, nome_visual, progresso, objetivo, concluida FROM conquistas WHERE username = ?', (username,))
    resultado = cursor.fetchall()
    conn.close()

    lista_conquistas = [
        {
            "codigo": linha[0],
            "nome_visual": linha[1],
            "progresso": linha[2],
            "objetivo": linha[3],
            "concluida": bool(linha[4])
        } for linha in resultado
    ]
    
    return jsonify({"status": "sucesso", "conquistas": lista_conquistas})
# ROTA 12 Progredir em uma conquista específica (ex: Carniceiro de Portais)
@app.route('/progredir_conquista', methods=['POST'])
def progredir_conquista():
    dados = request.get_json()
    username = dados.get('username')
    codigo = dados.get('codigo_conquista')
    valor_adicional = dados.get('valor', 1) 

    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    cursor.execute('SELECT progresso, objetivo FROM conquistas WHERE username = ? AND codigo_conquista = ?', (username, codigo))
    resultado = cursor.fetchone()

    if resultado:
        progresso_atual, objetivo = resultado
        novo_progresso = progresso_atual + valor_adicional
        
        if novo_progresso >= objetivo:
            novo_progresso = objetivo
            concluida = 1
        else:
            concluida = 0

        cursor.execute('UPDATE conquistas SET progresso = ?, concluida = ? WHERE username = ? AND codigo_conquista = ?',
                       (novo_progresso, concluida, username, codigo))
        conn.commit()
        status = "sucesso"
    else:
        status = "erro_nao_encontrado"

    conn.close()
    return jsonify({"status": status})
#rota atualizar conquista na tabela conquista
@app.route('/atualizar_conquista', methods=['POST'])
def atualizar_conquista():
    dados = request.json
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    usuario = dados.get('username')
    codigo = dados.get('codigo_conquista')
    progresso_add = dados.get('progresso_adicional', 1)
    
    # Dicionário de Conquistas do Sistema (Pode expandir depois)
    info_conquistas = {
        "o_virtuoso": {"nome": "O Virtuoso", "objetivo": 10},
        "carniceiro": {"nome": "Carniceiro de Portais", "objetivo": 50}
    }
    
    # Se o código da conquista não existir no sistema, ignora
    if codigo not in info_conquistas:
        return jsonify({"status": "erro", "mensagem": "Conquista desconhecida"}), 400

    objetivo_final = info_conquistas[codigo]["objetivo"]
    nome_visual = info_conquistas[codigo]["nome"]

    # Verifica se já começou esta conquista
    cursor.execute("SELECT progresso FROM conquistas WHERE username = ? AND codigo_conquista = ?", (usuario, codigo))
    conquista_existente = cursor.fetchone()

    if conquista_existente:
        novo_progresso = conquista_existente[0] + progresso_add
        concluida = 1 if novo_progresso >= objetivo_final else 0
        cursor.execute('''
            UPDATE conquistas 
            SET progresso = ?, concluida = ? 
            WHERE username = ? AND codigo_conquista = ?
        ''', (novo_progresso, concluida, usuario, codigo))
    else:
        # Cria a conquista na primeira vez que pontuar
        concluida = 1 if progresso_add >= objetivo_final else 0
        cursor.execute('''
            INSERT INTO conquistas (username, codigo_conquista, nome_visual, progresso, objetivo, concluida)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (usuario, codigo, nome_visual, progresso_add, objetivo_final, concluida))

    conn.commit()
    conn.close()
    return jsonify({"status": "sucesso"})

# DESPERTAR DO SISTEMA

def iniciar_banco():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            username TEXT PRIMARY KEY, 
            senha TEXT NOT NULL, 
            nivel INTEGER DEFAULT 1, 
            xp INTEGER DEFAULT 0, 
            ouro INTEGER DEFAULT 100, 
            forca INTEGER DEFAULT 1, 
            agilidade INTEGER DEFAULT 1, 
            inteligencia INTEGER DEFAULT 1, 
            vitalidade INTEGER DEFAULT 1, 
            status_punicao INTEGER DEFAULT 0,
            data_ultima_diaria TEXT DEFAULT "",
            inventario TEXT DEFAULT "[]",
            titulo_equipado TEXT DEFAULT "Iniciante",
            hash_seguranca TEXT)
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS titulos_desbloqueados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            nome_titulo TEXT NOT NULL,
            FOREIGN KEY (username) REFERENCES usuarios(username)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS missoes_diarias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            nome_missao TEXT,
            atributo TEXT,
            concluida INTEGER DEFAULT 0,
            substituicao_usada INTEGER DEFAULT 0,
            data_criacao DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY(username) REFERENCES usuarios(username))
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conquistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            codigo_conquista TEXT,
            nome_visual TEXT,
            progresso INTEGER DEFAULT 0,
            objetivo INTEGER DEFAULT 100,
            concluida INTEGER DEFAULT 0,
            FOREIGN KEY(username) REFERENCES usuarios(username))
    ''')
    
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
            (2, 'Escudo de Madeira', 400, '+4 de Defesa', 'escudo'),
            (3, 'Armadura de Couro de Sombra', 1200, '+10 de Defesa', 'armadura'),
            (5, 'Adaga Enferrujada', 100, '+2 de Agilidade (Ataque Rápido)', 'arma'),
            
            # Consumíveis (Efeitos Distintos)
            (4, 'Poção de Cura (P)', 30, 'Recupera 30 de HP', 'pocao'),
            (9, 'Poção de Cura (M)', 80, 'Recupera 150 de HP', 'pocao'),
            (10, 'Poção de Cura (G)', 200, 'Recupera 500 de HP', 'pocao'),
            (11, 'Poção de Mana (P)', 30, 'Recupera 20 de MP', 'pocao'),
            (12, 'Poção de Mana (M)', 80, 'Recupera 50 de MP', 'pocao'),
            (13, 'Poção de Mana (G)', 200, 'Recupera 150 de MP', 'pocao'),
            
            # Utilitários e Mágicos
            (7, 'Anel de Mana', 800, '+20 de Energia Estelar (MP)', 'acessorio'),
            (8, 'Pergaminho de Retorno', 200, 'Fuga segura de dungeons', 'item')
        ]
        cursor.executemany('INSERT INTO loja VALUES (?, ?, ?, ?, ?)', itens)

    conn.commit()
    conn.close()
    print(" Monólito e Mercado sincronizados com sucesso!")


if __name__ == '__main__':
    iniciar_banco() 
    print(" O Cérebro Central (Backend) despertou na porta 5000!")
    app.run(debug=True, port=5000)
