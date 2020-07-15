<template>
  <div class="container">
    <header>
      <Content slot-key="header" />
    </header>
    <main>
      <Content />
    </main>
    <footer>
      <Content slot-key="footer" />
    </footer>
  </div>
</template>

<script>
export default {
  // name: "test"
};
</script>
<!-- This goes with a markdown file with this frontmatter and body
See: https://v1.vuepress.vuejs.org/guide/markdown-slot.html
See: https://vuepress.vuejs.org/theme/default-theme-config.html#custom-layout-for-specific-pages
See: https://vuepress.vuejs.org/theme/writing-a-theme.html#content-outlet
---
layout: Test
---

::: slot header
# Here might be a page title
:::

- A Paragraph
- Another Paragraph

::: slot footer
Here's some contact info
:::



-->