#include <iostream>
#include <vector>
#include <string>

using namespace std;

const int BOARD_SIZE = 15;
const char EMPTY = ' ';
const char BLACK = 'X';
const char WHITE = 'O';

class Gomoku {
private:
    vector<vector<char>> board;
    char currentPlayer;
    bool gameOver;
    char winner;

public:
    Gomoku() {
        board.resize(BOARD_SIZE, vector<char>(BOARD_SIZE, EMPTY));
        currentPlayer = BLACK;
        gameOver = false;
        winner = EMPTY;
    }

    void displayBoard() {
        system("cls");
        cout << "  ";
        for (int i = 0; i < BOARD_SIZE; i++) {
            cout << i << " ";
        }
        cout << endl;

        for (int i = 0; i < BOARD_SIZE; i++) {
            cout << i << " ";
            for (int j = 0; j < BOARD_SIZE; j++) {
                cout << board[i][j] << " ";
            }
            cout << endl;
        }
    }

    bool makeMove(int row, int col) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            return false;
        }

        if (board[row][col] != EMPTY) {
            return false;
        }

        board[row][col] = currentPlayer;
        return true;
    }

    bool checkWin(int row, int col) {
        char player = board[row][col];
        
        // 检查横向
        int count = 1;
        for (int j = col + 1; j < BOARD_SIZE && board[row][j] == player; j++) count++;
        for (int j = col - 1; j >= 0 && board[row][j] == player; j--) count++;
        if (count >= 5) return true;

        // 检查纵向
        count = 1;
        for (int i = row + 1; i < BOARD_SIZE && board[i][col] == player; i++) count++;
        for (int i = row - 1; i >= 0 && board[i][col] == player; i--) count++;
        if (count >= 5) return true;

        // 检查对角线
        count = 1;
        for (int i = row + 1, j = col + 1; i < BOARD_SIZE && j < BOARD_SIZE && board[i][j] == player; i++, j++) count++;
        for (int i = row - 1, j = col - 1; i >= 0 && j >= 0 && board[i][j] == player; i--, j--) count++;
        if (count >= 5) return true;

        // 检查反对角线
        count = 1;
        for (int i = row + 1, j = col - 1; i < BOARD_SIZE && j >= 0 && board[i][j] == player; i++, j--) count++;
        for (int i = row - 1, j = col + 1; i >= 0 && j < BOARD_SIZE && board[i][j] == player; i--, j++) count++;
        if (count >= 5) return true;

        return false;
    }

    bool checkDraw() {
        for (int i = 0; i < BOARD_SIZE; i++) {
            for (int j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] == EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }

    void switchPlayer() {
        currentPlayer = (currentPlayer == BLACK) ? WHITE : BLACK;
    }

    void play() {
        int row, col;
        while (!gameOver) {
            displayBoard();
            cout << "Player " << currentPlayer << "'s turn. Enter row and column (e.g., 3 5): ";
            cin >> row >> col;

            if (makeMove(row, col)) {
                if (checkWin(row, col)) {
                    gameOver = true;
                    winner = currentPlayer;
                    displayBoard();
                    cout << "Player " << winner << " wins!" << endl;
                } else if (checkDraw()) {
                    gameOver = true;
                    displayBoard();
                    cout << "It's a draw!" << endl;
                } else {
                    switchPlayer();
                }
            } else {
                cout << "Invalid move. Please try again." << endl;
                system("pause");
            }
        }
        system("pause");
    }
};

int main() {
    Gomoku game;
    game.play();
    return 0;
}