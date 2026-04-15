@echo off
REM Build Script for Hostinger Deployment
echo 1. Building React App...
call npm run build

echo 2. Preparing Deployment Structure...
if exist hostinger-deploy rmdir /s /q hostinger-deploy
mkdir hostinger-deploy

echo 3. Copying Frontend...
xcopy /E /I /Y dist hostinger-deploy

echo 4. Copying Backend API...
mkdir hostinger-deploy\api
xcopy /E /I /Y api hostinger-deploy\api

echo 5. Copying Config Files...
copy .htaccess hostinger-deploy\.htaccess
copy database.sql hostinger-deploy\database.sql

echo ---------------------------------------------------
echo DEPLOYMENT READY!
echo Upload the contents of the 'hostinger-deploy' folder
echo to your 'public_html' directory on Hostinger.
echo ---------------------------------------------------
pause
