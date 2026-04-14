from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
# O CORS permite que o seu index.html converse com este servidor Python
CORS(app) 

# ==========================================
# 🗄️ A FORJA DO BANCO DE DADOS (SQLite)
# ==========================================
def iniciar_banco():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    
    # Cria a tabela de saves se for a primeira vez rodando
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saves (
            id INTEGER PRIMARY KEY,
            dados JSON
        )
    ''')
    
    # Cria o "Slot 1" de save vazio para o Imperador
    cursor.execute('SELECT COUNT(*) FROM saves')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO saves (id, dados) VALUES (1, "{}")')
    
    conn.commit()
    conn.close()

# ==========================================
# 📡 ROTAS DA API (A Ponte de Comunicação)
# ==========================================

# ROTA 1: O JavaScript chama esta rota para GRAVAR no banco
@app.route('/salvar', methods=['POST'])
def salvar_estado():
    dados_json = request.json
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    
    # Atualiza o Slot 1 com o novo estado do Monarca
    cursor.execute('UPDATE saves SET dados = ? WHERE id = 1', (json.dumps(dados_json),))
    
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "Sincronização com o Monólito de Dados concluída."})

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

# ==========================================
# 🚀 DESPERTAR DO SISTEMA
# ==========================================
if __name__ == '__main__':
    iniciar_banco()
    print("🟢 O Cérebro Central (Backend) despertou na porta 5000!")
    app.run(debug=True, port=5000)