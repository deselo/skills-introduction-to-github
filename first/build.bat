@echo off

echo Building Gomoku game...

:: 检查是否有 g++ 编译器
where g++ > nul
if %errorlevel% equ 0 (
    g++ main.cpp -o gomoku.exe
) else (
    :: 检查是否有 cl.exe (Visual Studio 编译器)
    where cl > nul
    if %errorlevel% equ 0 (
        cl main.cpp /Fe:gomoku.exe
    ) else (
        echo Error: No C++ compiler found. Please install MinGW or Visual Studio.
        pause
        exit /b 1
    )
)

if %errorlevel% equ 0 (
    echo Build successful! Run gomoku.exe to play the game.
    gomoku.exe
) else (
    echo Build failed.
    pause
    exit /b 1
)