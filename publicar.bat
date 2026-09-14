@echo off
cd /d C:\Avenida\Sistema\ImpulsoAfiliados

echo ===================================
echo  Publicar alteracoes - ImpulsoAfiliados
echo ===================================
echo.

set /p MSG="Mensagem do commit (Enter para usar padrao): "
if "%MSG%"=="" set MSG=Atualizacao %date% %time%

git add .
git commit -m "%MSG%"
git push

echo.
echo ===================================
echo Concluido. A Vercel vai fazer o deploy automatico agora.
echo ===================================
pause
