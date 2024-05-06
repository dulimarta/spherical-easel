import DefaultTheme from 'vitepress/theme'
import './custom.css'
import type { Theme } from 'vitepress'
import ToolTitle from './ToolTitle.vue';
import IconBase from '../../../src/components/IconBase.vue'


export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // register your custom global components
    app.component('ToolTitle',ToolTitle)
    app.component('IconBase',IconBase)
  }
} satisfies Theme