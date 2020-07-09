<template>
  <div class="tikz" v-html="latexSnippet"></div>
</template>

<script>
import axios from "axios";
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
    let filePath;

    // Failed attempt to load from current directory
    if (this.latex.startsWith(".") || this.latex.startsWith("/")) {
      filePath = this.latex;
    } else {
      filePath = "/" + this.latex;
    }
    axios.get(filePath).then(r => {
      // console.debug("LaTeX snippet is", r);
      this.latexSnippet =
        String.raw`<script type="text/tikz">` + r.data + "<\\/script>";
    });
  }
};
</script>

<style scoped></style>
