/// <reference types="vite/client" />

// Explicit side-effect CSS import support (for import './styles.css')
declare module '*.css' {
  const styles: string;
  export default styles;
}
