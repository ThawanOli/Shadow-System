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

# ROTA 1: O JavaScript chama esta rota para GRAVAR no banco
@app.route('/salvar', methods=['POST'])
def salvar_estado():
    dados_json = request.json
    lacre_recebido = request.headers.get('X-Lacre-Integridade')
    
    # Verifica o lacre de integridade
    mensagem = f"{dados_json['nivel']}{dados_json['ouro']}{dados_json['xp']}{CHAVE_SECRETA}"
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
        print(f"✅ Save do Imperador (Nvl {dados_json['nivel']}) sincronizado com o Monólito.")
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

# DESPERTAR DO SISTEMA

def iniciar_banco():
    conn = sqlite3.connect('shadow_system.db')
    cursor = conn.cursor()
    # Cria a tabela se ela não existir
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saves (
            id INTEGER PRIMARY KEY,
            nome TEXT,
            dados TEXT
        )
    ''')
    # Verifica se já existe um slot de save (ID 1), se não, cria um inicial
    cursor.execute('SELECT id FROM saves WHERE id = 1')
    if not cursor.fetchone():
        cursor.execute('INSERT INTO saves (id, nome, dados) VALUES (?, ?, ?)', 
                       (1, "Thawan Oliveira", "{}"))
    conn.commit()
    conn.close()
    print(" Monólito de Dados verificado e pronto.")

# --- DESPERTAR DO SISTEMA ---
if __name__ == '__main__':
    iniciar_banco() 
    print(" O Cérebro Central (Backend) despertou na porta 5000!")
    app.run(debug=True, port=5000)
