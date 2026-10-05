<script setup>
import Code from '@tiptap/extension-code'
import Document from '@tiptap/extension-document'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'

import { StarterKit } from '@tiptap/starter-kit'
import {
  EditorContent,
  useEditor,
} from '@tiptap/vue-3'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    TextAlign.configure({
      types: [
        'heading',
        'paragraph',
      ],
    }),
    Placeholder.configure({ placeholder: props.placeholder ?? 'Write something here...' }),
    Underline,
    Document,
    Paragraph,
    Text,
    Code,
    Link.configure({
      openOnClick: false,
      defaultProtocol: 'https',
    }),
  ],
  onUpdate() {
    if (!editor.value)
      return
    emit('update:modelValue', editor.value.getHTML())
  },
})

watch(() => props.modelValue, () => {
  const isSame = editor.value?.getHTML() === props.modelValue
  if (isSame)
    return
  editor.value?.commands.setContent(props.modelValue)
})

const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()

    return
  }

  // update link
  editor.value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()
}
</script>

<template>
  <div>
    <div
      v-if="label"
      class="font-weight-medium text-sm px-3 py-2 border-b"
    >
      {{ label }}
    </div>

    <div
      v-if="editor"
      class="d-flex gap-3 pa-2 flex-wrap align-center bg-grey-100"
    >
      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-1"
          :color="editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        />
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-2"
          :color="editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        />
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-3"
          :color="editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        />
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-4"
          :color="editor.isActive('heading', { level: 4 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
        />
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-5"
          :color="editor.isActive('heading', { level: 5 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
        />
        <VBtn
          class="font-weight-medium"
          icon="tabler-h-6"
          :color="editor.isActive('heading', { level: 6 }) ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
        />
      </VBtnToggle>
      
      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          class="font-weight-medium"
          icon="tabler-bold"
          :color="editor.isActive('bold') ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleBold().run()"
        />

        <VBtn
          :color="editor.isActive('underline') ? 'primary' : 'default'"
          icon="tabler-underline"
          @click="editor.commands.toggleUnderline()"
        />

        <VBtn
          :color="editor.isActive('italic') ? 'primary' : 'default'"
          icon="tabler-italic"
          @click="editor.chain().focus().toggleItalic().run()"
        />

        <VBtn
          icon="tabler-strikethrough"
          :color="editor.isActive('strike') ? 'primary' : 'default'"
          @click="editor.chain().focus().toggleStrike().run()"
        />
      </VBtnToggle>

      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'"
          icon="tabler-align-left"
          @click="editor.chain().focus().setTextAlign('left').run()"
        />

        <VBtn
          icon="tabler-align-center"
          :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'"
          @click="editor.chain().focus().setTextAlign('center').run()"
        />

        <VBtn
          :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'"
          icon="tabler-align-right"
          @click="editor.chain().focus().setTextAlign('right').run()"
        />

        <VBtn
          :color="editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'"
          icon="tabler-align-justified"
          @click="editor.chain().focus().setTextAlign('justify').run()"
        />
      </VBtnToggle>
     
      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          :color="editor.isActive('bulletList') ? 'primary' : 'default'"
          icon="tabler-list"
          @click="editor.chain().focus().toggleBulletList().run()"
        />
        <VBtn
          :color="editor.isActive('orderedList') ? 'primary' : 'default'"
          icon="tabler-list-numbers"
          @click="editor.chain().focus().toggleOrderedList().run()"
        />
      </VBtnToggle>
    
      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          icon="tabler-link"
          @click="setLink"
        />
      </VBtnToggle>
   
      <VBtnToggle
        density="comfortable"
        variant="outlined"
        class="bg-background"
      >
        <VBtn
          :disabled="!editor.can().undo()"
          icon="tabler-arrow-back"
          @click="editor.chain().focus().undo().run()"
        />
        <VBtn
          :disabled="!editor.can().redo()"
          icon="tabler-arrow-forward"
          @click="editor.chain().focus().redo().run()"
        />
      </VBtnToggle>
    </div>

    <VDivider />

    <EditorContent
      ref="editorRef"
      class="ProseMirror tiptap"
      :editor="editor"
    />
  </div>
</template>

<style lang="scss">
.ProseMirror {
  padding: 0.5rem;
  min-block-size: 15vh;

  p {
    margin-block-end: 0;
  }

  p.is-editor-empty:first-child::before {
    block-size: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    float: inline-start;
    pointer-events: none;
  }
}

.tiptap {
  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: var(--purple-light);
    border-radius: 0.4rem;
    color: var(--black);
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: var(--black);
    border-radius: 0.5rem;
    color: var(--white);
    font-family: 'JetBrainsMono', monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;

    code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }
  }

  blockquote {
    border-left: 3px solid var(--gray-3);
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid var(--gray-2);
    margin: 2rem 0;
  }

  /* Link styles */
  a {
    color: blue;
    cursor: pointer;
  }
}
</style>
