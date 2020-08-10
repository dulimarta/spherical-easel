<template>
  <v-card :elevation="20">
    <div class="tikz"
      v-html="latexSnippet">
      Please refresh your browser
    </div>
  </v-card>
</template>

<script>
import axios from "axios";
export default {
  // kebab-case translates to KebabCase
  // So tikz-picture translates to TikzPicture
  // And tik-z-picture translates to TikZPicture
  name: "tik-z-picture",
  props: {
    latex: ""
  },
  data() {
    return {
      latexSnippet: "",
      doneFetching: false
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
    this.doneFetching = false;
    axios.get(filePath).then(r => {
      // console.debug("LaTeX snippet is", r);
      this.latexSnippet =
        String.raw`<script type="text/tikz">` + r.data + "<\\/script>";
      this.doneFetching = true;
    });
  }
};
</script>

<style scoped>
.tikz {
  border: 1px solid gray;
  min-height: 2em;
}
</style>
