const out = "M1 + M2".matchAll(/[Mm][0-9]+/g);
for (const x of out) {
  console.debug(x[0]);
}
