// Плоский конфиг ESLint (v9). Задача — ловить настоящие ошибки (опечатки в
// именах, дубли ключей объекта, недостижимый код, случайное присваивание в
// условии), а не спорить о стиле: форматирование не трогаем вообще.
//
//   npm run lint        — проверить весь проект
//   npx eslint --fix .  — починить то, что чинится автоматически
//
// Три разных мира кода живут по разным правилам:
//   server/**            — Node, CommonJS (require/module), глобали Node
//   public/script/**,    — браузер, обычные <script> (не модули); функции
//   public/admin/**        объявлены в global scope и зовутся из onclick="..."
//                          в шаблонах, поэтому no-unused-vars для них выключен
//   public/sw.js         — service worker, свой набор глобалей
//   test/**              — Node + встроенный тест-раннер node:test

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      // Рекламные страницы Adsterra — сторонний код, не наш, не проверяем.
      'public/x/**',
      // Внешняя библиотека с CDN, лежит копией — не наша.
      'public/**/*.min.js'
    ]
  },

  js.configs.recommended,

  // Общие послабления для всего проекта.
  {
    rules: {
      // Пустой catch — осознанный приём в этом коде (fire-and-forget запросы,
      // «токен битый — просто считаем гостем» и т.п.), везде с комментарием.
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // В коде есть намеренные while(true) с внутренним break (генерация
      // уникального shortId) — это не ошибка.
      'no-constant-condition': ['error', { checkLoops: false }]
    }
  },

  // Сервер: Node + CommonJS.
  {
    files: ['server/**/*.js', 'eslint.config.js', 'esbuild.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }]
    }
  },

  // Клиент: браузер, обычные скрипты (глобальный scope).
  {
    files: ['public/script/**/*.js', 'public/admin/**/*.js', 'public/blog/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Подключаются отдельными <script> с CDN / Google Identity Services.
        QRCode: 'readonly',
        google: 'readonly',
        // GA4: dataLayer заводится в gtag-init.js через window.dataLayer.
        dataLayer: 'writable',
        // Префиксный legacy-конструктор для Safari (feature-detect в main.js).
        webkitAudioContext: 'readonly'
      }
    },
    rules: {
      // Почти все функции здесь объявлены в global scope и вызываются строкой
      // из onclick="..." в HTML-шаблонах — ESLint этого не видит и пометил бы
      // полторы сотни живых функций как «неиспользуемые». Проверка имён
      // (no-undef) при этом остаётся включённой и ловит реальные опечатки.
      'no-unused-vars': 'off'
    }
  },

  // Service worker.
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker }
    }
  },

  // Тесты: Node + node:test.
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }]
    }
  }
];
