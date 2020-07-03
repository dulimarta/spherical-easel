<template>
  <div v-html="latexSnippet"></div>
</template>

<script>
export default {
  name: "tikz-picture",
  props: {
    latex: ""
  },
  data() {
    return {
      latexSnippet: "N/A"
    };
  },
  mounted() {
    // console.debug("Load LaTeX content from", this.latex);
    fetch(`/${this.latex}`)
      .then(r => r.text())
      .then(d => {
        // console.debug("LaTeX snippet is", d);
        this.latexSnippet =
          String.raw`<script type="text/tikz">` + d + "<\\/script>";
      });
  }
};
</script>

<style scoped></style>
