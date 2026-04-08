/// <reference types="vite/client" />

declare module '@codemirror/view' {
  export { EditorView }
}

declare module '@codemirror/language' {
  export { StreamLanguage }
}

declare module '@codemirror/legacy-modes/mode/groovy' {
  export { groovy }
}

declare module 'vue-codemirror6' {
  const CodeMirror: any
  export default CodeMirror
}

declare module '@xiechao/codemirror-lang-handlebars' {
  export { handlebarsLanguage }
}

interface ImportMetaEnv {
  readonly VITE_MIXPLA_SERVER?: string
  readonly VITE_KEYCLOAK_URL?: string
  readonly VITE_KEYCLOAK_REALM?: string
  readonly VITE_KEYCLOAK_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
