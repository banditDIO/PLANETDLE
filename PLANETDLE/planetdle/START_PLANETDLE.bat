@echo off
cd /d "%~dp0"
set "PYTHON=python"
where py >nul 2>nul && set "PYTHON=py -3"
echo Installing/checking Flask...
%PYTHON% -m pip install -r requirements.txt
if errorlevel 1 (
 echo Could not install dependencies. Check Python and internet connection.
 pause
 exit /b 1
)
echo.
echo Starting PLANETDLE at http://127.0.0.1:5000/
start "" "http://127.0.0.1:5000/"
%PYTHON% app.py
if errorlevel 1 echo The server stopped with an error. See details above.
pause
