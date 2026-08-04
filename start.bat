@echo off
title Probiyom Yerel Sunucusu
cd /d "%~dp0"
set "PY=python"
where python >nul 2>nul
if errorlevel 1 set "PY=py"
echo Probiyom yerel sunucusu baslatiliyor...
echo Hata alirsaniz asagidaki pencere acik kalir ve mesaji gorursunuz.
echo.
%PY% serve.py 7076
echo.
echo Sunucu kapandi. Devam etmek icin bir tusa basin...
pause >nul
