@echo off
cd /d %~dp0
start "xhs-api" cmd /k node .\server\server.mjs
start "xhs-web" cmd /k node .\node_modules\vite\bin\vite.js --host 127.0.0.1
