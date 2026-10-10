// 코드 검사 설정 — `npm run lint`
// 빌드(vite build)는 정의 안 된 이름이나 '선언 전에 사용' 실수를 잡지 못한다. 실제로 그런 실수로
// 화면이 통째로 죽거나(정의 안 된 cardBg) 일정 수정 저장이 안 된 적이 있어서(선언 전 사용), 이 두 가지는 오류로 막는다.
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['build/**', 'dist/**', 'android/**', 'node_modules/**', 'scripts/**', 'supabase/**'] },
  {
    files: ['src/**/*.{js,jsx}', 'api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    // 의존성 규칙을 꺼 둬서 코드 안의 해당 '끄기' 표시가 '안 쓰임'으로 경고되는 걸 막는다
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'no-undef': 'error',
      // 같은 함수 안에서 const를 선언 전에 쓰는 실수 (안쪽 함수에서 나중에 쓰는 건 괜찮아서 variables: false)
      'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
      'react-hooks/rules-of-hooks': 'error',
      // 기존 코드에 의존성 경고가 많아 지금은 끈다 (코드 안의 '// eslint-disable-next-line' 표시는 그대로 둠)
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: { globals: { ...globals.vitest, ...globals.jest } },
  },
];
