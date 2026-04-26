#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SMART CHILD CARE SYSTEM Production Startup
python run.py → Backend + Frontend LIVE!
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def main():
    print("🚀 SMART CHILD CARE SYSTEM Fullstack - Starting...")
    
    # 1. Clean previous env if broken
    if os.path.exists('scc_env'):
        print("🧹 Cleaning broken environment...")
        shutil.rmtree('scc_env')
    
    # 2. Create virtualenv
    print("📦 Creating virtual environment...")
    subprocess.run([sys.executable, '-m', 'venv', 'scc_env'], check=True)
    
    # 3. Install dependencies (Windows paths)
    print("📦 Installing dependencies...")
    pip_path = 'scc_env\\Scripts\\pip.exe' if os.name == 'nt' else 'scc_env/bin/pip'
    subprocess.run([pip_path, 'install', '-r', 'requirements.txt'], check=True)
    
    # 4. Initialize Flask-DB
    print("🗄️ Initializing database...")
    os.environ['FLASK_APP'] = 'app.py'
    flask_path = 'scc_env\\Scripts\\flask.exe' if os.name == 'nt' else 'scc_env/bin/flask'
    subprocess.run([flask_path, 'db', 'init'], check=False)
    subprocess.run([flask_path, 'db', 'migrate'], check=False)
    subprocess.run([flask_path, 'db', 'upgrade'], check=False)
    
    # 5. Start backend
    print("🌐 Backend starting on http://localhost:5000")
    print("📱 Frontend: Open index.html in browser")
    print("💾 Data stored in instance/smartchildcare.db")
    print("\n✅ LIVE! Install as PWA from browser")
    print("Ctrl+C to stop")
    
    # Start Flask dev server
    python_path = 'scc_env\\Scripts\\python.exe' if os.name == 'nt' else 'scc_env/bin/python'
    env = os.environ.copy()
    env['FLASK_ENV'] = 'development'
    subprocess.run([python_path, 'app.py'], env=env)

if __name__ == '__main__':
    main()

