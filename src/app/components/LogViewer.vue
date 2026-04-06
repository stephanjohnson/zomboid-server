<script setup lang="ts">
import type { MonacoEditor as MonacoEditorType } from '#components'
import { Check, Clipboard } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  value: string
  placeholder?: string
  follow?: boolean
  reverse?: boolean
}>(), {
  follow: false,
  reverse: false,
})

const colorMode = useColorMode()
const copied = ref(false)
const editorRef = useTemplateRef<InstanceType<typeof MonacoEditorType>>('editorRef')

const displayValue = computed(() => {
  const raw = props.value || props.placeholder || ''
  if (!props.reverse || !props.value) return raw
  return raw.split('\n').reverse().join('\n')
})

const monacoTheme = computed(() =>
  colorMode.value === 'dark' ? 'pz-log-dark' : 'pz-log-light',
)

const editorOptions = computed(() => ({
  readOnly: true,
  minimap: { enabled: false },
  lineNumbers: 'off' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  folding: false,
  renderLineHighlight: 'none' as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  scrollbar: {
    vertical: 'auto' as const,
    horizontal: 'hidden' as const,
    verticalScrollbarSize: 8,
  },
  contextmenu: false,
  fontSize: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  padding: { top: 8, bottom: 8 },
  domReadOnly: true,
  automaticLayout: true,
}))

function registerPzLogLanguage(monaco: typeof import('monaco-editor')) {
  if (monaco.languages.getLanguages().some(l => l.id === 'pz-log')) return

  monaco.languages.register({ id: 'pz-log' })
  monaco.languages.setMonarchTokensProvider('pz-log', {
    tokenizer: {
      root: [
        // Unified timestamp: 2026-04-06 09:27:16.022
        [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/, 'pz-timestamp'],

        // Log levels (bracketed format)
        [/\[FATAL\]/, 'pz-fatal'],
        [/\[ERROR\]/, 'pz-error'],
        [/\[WARN\]/, 'pz-warn'],
        [/\[LOG\]/, 'pz-log'],

        // Category tags after log level
        [/\b(General|Script|Network|WorldGen|Sound|Lua|Multiplayer|ActionSystem|Vehicles)\b/, 'pz-category'],

        // Java class.method references
        [/\b[A-Z]\w+\.\w+\b(?=>)/, 'pz-source'],

        // Important milestone patterns
        [/LOADING ASSETS:\s*(START|FINISH)/, 'pz-milestone'],
        [/Loading world\.\.\./, 'pz-milestone'],
        [/Success! App '\d+' fully installed\./, 'pz-milestone'],
        [/\[ZomboidManager\]/, 'pz-milestone'],
        [/Server will restart in/, 'pz-warn'],

        // Entrypoint markers
        [/\[entrypoint\]/, 'pz-entrypoint'],

        // Property/icon warnings (benign)
        [/Property Name not found:.*/, 'comment'],
        [/Could not find icon:.*/, 'comment'],
        [/no such model.*/, 'comment'],

        // Strings and paths
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],

        // Numbers
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
    },
  })

  const sharedRules = [
    { token: 'pz-timestamp', foreground: '6b7280' },
    { token: 'pz-fatal', foreground: 'ef4444', fontStyle: 'bold' },
    { token: 'pz-error', foreground: 'f87171' },
    { token: 'pz-warn', foreground: 'facc15' },
    { token: 'pz-log', foreground: '60a5fa' },
    { token: 'pz-category', foreground: '818cf8' },
    { token: 'pz-source', foreground: '6b7280' },
    { token: 'pz-milestone', foreground: '34d399', fontStyle: 'bold' },
    { token: 'pz-entrypoint', foreground: '38bdf8' },
  ]

  monaco.editor.defineTheme('pz-log-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      ...sharedRules,
      { token: 'comment', foreground: '4b5563' },
    ],
    colors: {
      'editor.background': '#0c0c0e',
      'editor.foreground': '#d1d5db',
    },
  })

  monaco.editor.defineTheme('pz-log-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'pz-timestamp', foreground: '9ca3af' },
      { token: 'pz-fatal', foreground: 'dc2626', fontStyle: 'bold' },
      { token: 'pz-error', foreground: 'ef4444' },
      { token: 'pz-warn', foreground: 'ca8a04' },
      { token: 'pz-log', foreground: '2563eb' },
      { token: 'pz-category', foreground: '6366f1' },
      { token: 'pz-source', foreground: '9ca3af' },
      { token: 'pz-milestone', foreground: '059669', fontStyle: 'bold' },
      { token: 'pz-entrypoint', foreground: '0284c7' },
      { token: 'comment', foreground: '9ca3af' },
    ],
    colors: {
      'editor.background': '#fafafa',
      'editor.foreground': '#1f2937',
    },
  })
}

function scrollToBottom() {
  const editor = editorRef.value?.$editor
  if (!editor) return
  const model = editor.getModel()
  if (!model) return
  const lineCount = model.getLineCount()
  editor.revealLine(lineCount, 1 /* Immediate */)
}

function scrollToTop() {
  const editor = editorRef.value?.$editor
  if (!editor) return
  editor.revealLine(1, 1 /* Immediate */)
}

watch(displayValue, () => {
  if (props.follow && !props.reverse) {
    nextTick(scrollToBottom)
  }
  else if (props.follow && props.reverse) {
    nextTick(scrollToTop)
  }
})

async function handleReady() {
  const monaco = await useMonaco()
  if (monaco) {
    registerPzLogLanguage(monaco)
  }
}

async function copyLogs() {
  const textToCopy = props.value || props.placeholder || ''
  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    // Fallback for non-HTTPS contexts
    const textarea = document.createElement('textarea')
    textarea.value = textToCopy
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

onMounted(handleReady)
</script>

<template>
  <div class="relative group flex-1 min-h-0">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="absolute right-2 top-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="copyLogs"
        >
          <Check v-if="copied" class="size-3.5 text-green-500" />
          <Clipboard v-else class="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        {{ copied ? 'Copied!' : 'Copy logs (original order)' }}
      </TooltipContent>
    </Tooltip>
    <MonacoEditor
      ref="editorRef"
      :model-value="displayValue"
      lang="pz-log"
      :options="editorOptions"
      :theme="monacoTheme"
      class="h-full w-full rounded-md border border-border overflow-hidden"
      @load="(editor: any) => { if (follow && !reverse) scrollToBottom(); else if (follow && reverse) scrollToTop() }"
    >
      <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    </MonacoEditor>
  </div>
</template>
