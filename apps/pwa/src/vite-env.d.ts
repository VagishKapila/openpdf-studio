/// <reference types="vite/client" />

// Explicit side-effect CSS import support (for import './styles.css')
declare module '*.css' {
  const styles: string;
  export default styles;
}
// COWORK-45 redeploy trigger — all 4 commits in tree (deb41c9a56)
