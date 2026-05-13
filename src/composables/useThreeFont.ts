import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import axios from "axios";
import { Ref, ref } from "vue";
export function useThreeFont() {
  const font: Ref<Font | null> = ref(null);

  (async function () {
    const fontLoader = new FontLoader();
    font.value = await axios
      .get("/droid_sans_regular.typeface.json")
      .then(r => r.data)
      .then(json => {
        // console.debug("JSON of font", json);
        return fontLoader.parse(json);
      });
    console.debug("Font is", font.value);
  })();
  return { font };
}
