import { Command } from 'commander';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

// --- Конфігурація Commander.js ---
const program = new Command();

program
    .requiredOption('-h, --host <address>', 'Адреса сервера (обов\'язковий)')
    .requiredOption('-p, --port <number>', 'Порт сервера (обов\'язковий)', parseInt)
    .requiredOption('-c, --cache <path>', 'Шлях до директорії, яка міститиме кешовані файли (обов\'язковий)');

program.parse(process.argv);

const options = program.opts();
const { host, port, cache } = options;

/**
 * Асинхронна функція для перевірки та створення директорії кешу.
 * @param {string} dirPath - Шлях до директорії кешу.
 */
async function initializeCache(dirPath) {
    try {
        console.log(`Перевірка директорії кешу: ${dirPath}`);
        // Використовуємо fs.access для перевірки існування директорії
        await fs.access(dirPath);
        console.log('Директорія кешу вже існує.');
    } catch (error) {
        // Якщо сталася помилка (директорія не існує), створюємо її
        if (error.code === 'ENOENT') {
            console.log('Директорія кешу не знайдена. Створення...');
            // Використовуємо { recursive: true } для створення всього шляху
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`Директорія кешу успішно створена: ${dirPath}`);
        } else {
            // Обробка інших помилок доступу
            console.error(`Помилка під час доступу до директорії кешу: ${error.message}`);
            process.exit(1);
        }
    }
}

/**
 * Функція-обробник для всіх HTTP-запитів.
 * Тут буде реалізована логіка Частини 2.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function requestListener(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Веб-сервіс інвентаризації працює!
    Хост: ${host}
    Порт: ${port}
    Директорія кешу: ${path.resolve(cache)}
    Отримано запит: ${req.method} ${req.url}`);
}

/**
 * Головна функція, яка запускає ініціалізацію та веб-сервер.
 */
async function main() {
    try {
        // 1. Логіка Кешу: Ініціалізація директорії
        await initializeCache(cache);

        // 2. Створення та запуск Веб-сервера
        const server = http.createServer(requestListener);

        server.listen(port, host, () => {
            console.log('--- СЕРВІС ЗАПУЩЕНО ---');
            console.log(`Сервер бігає на: http://${host}:${port}`);
            console.log(`Локальний шлях кешу: ${path.resolve(cache)}`);
            console.log('-----------------------');
        });
    } catch (e) {
        console.error('Критична помилка під час запуску сервера:', e);
        process.exit(1);
    }
}

main();