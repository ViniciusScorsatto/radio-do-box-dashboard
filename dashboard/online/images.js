(() => {
  const form = document.getElementById("images-form");
  const files = document.getElementById("image-files");
  const list = document.getElementById("image-list");
  const mode = document.getElementById("image-mode");
  const prepareButton = document.getElementById("prepare-images");
  const renderButton = document.getElementById("render-images");
  let items = [],
    snapshot = null,
    version = 0,
    busy = false;
  const total = () =>
    mode.value === "single"
      ? 12
      : items.reduce((n, item) => n + Number(item.seconds), 0);
  const valid = () =>
    (mode.value === "single"
      ? items.length === 1
      : items.length >= 2 && items.length <= 5) &&
    (mode.value === "single" ||
      items.every(
        (item) =>
          Number.isInteger(Number(item.seconds)) &&
          item.seconds >= 1 &&
          item.seconds <= 60,
      )) &&
    total() <= 60;
  function invalidate() {
    version++;
    snapshot = null;
    renderButton.disabled = true;
    document.getElementById("image-preview-note").textContent =
      "Prepare a prévia para aplicar suas imagens e ajustes.";
    summary();
  }
  function summary() {
    const text = !items.length
      ? "Escolha uma imagem para começar."
      : `${items.length} imagem(ns) · ${total()} segundos no total${total() > 60 ? " — máximo de 60 segundos" : ""}`;
    document.getElementById("image-total").textContent = text;
    prepareButton.disabled = busy || !valid();
    files.disabled = busy || items.length >= (mode.value === "single" ? 1 : 5);
  }
  function draw() {
    list.replaceChildren();
    items.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "image-item";
      const image = document.createElement("img");
      image.src = item.url;
      image.alt = `Imagem ${index + 1}: ${item.file.name}`;
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = `${index + 1}. ${item.file.name}`;
      const label = document.createElement("label");
      label.textContent = "Duração (segundos)";
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = "60";
      input.step = "1";
      input.value = mode.value === "single" ? 12 : item.seconds;
      input.disabled = mode.value === "single" || busy;
      input.oninput = () => {
        item.seconds = Number(input.value);
        invalidate();
      };
      label.append(input);
      const actions = document.createElement("div");
      actions.className = "actions";
      const button = (text, fn, disabled = false) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.disabled = disabled || busy;
        b.onclick = fn;
        actions.append(b);
      };
      button(
        "↑ Antes",
        () => {
          [items[index - 1], items[index]] = [items[index], items[index - 1]];
          invalidate();
          draw();
        },
        index === 0,
      );
      button(
        "↓ Depois",
        () => {
          [items[index + 1], items[index]] = [items[index], items[index + 1]];
          invalidate();
          draw();
        },
        index === items.length - 1,
      );
      button("Remover", () => {
        URL.revokeObjectURL(item.url);
        items.splice(index, 1);
        invalidate();
        draw();
      });
      details.append(name, label, actions);
      row.append(image, details);
      list.append(row);
    });
    summary();
  }
  mode.onchange = () => {
    files.multiple = mode.value === "sequence";
    invalidate();
    draw();
  };
  form.addEventListener("input", (event) => {
    if (event.target !== files) invalidate();
  });
  files.onchange = async () => {
    const selected = [...files.files];
    files.value = "";
    if (items.length + selected.length > (mode.value === "single" ? 1 : 5)) {
      status(
        "Use uma imagem no modo único ou até cinco no modo sequência.",
        true,
      );
      return;
    }
    busy = true;
    mode.disabled = true;
    draw();
    try {
      for (const file of selected) {
        if (
          !["image/jpeg", "image/png"].includes(file.type) ||
          file.size > 8 * 1024 * 1024
        ) {
          status("Envie JPG/PNG de até 8 MB.", true);
          continue;
        }
        try {
          const bitmap = await createImageBitmap(file);
          const correct = bitmap.width === 1080 && bitmap.height === 1920;
          bitmap.close();
          if (!correct) throw Error("A imagem precisa ter 1080 × 1920 pixels.");
          items.push({
            file,
            url: URL.createObjectURL(file),
            seconds: 12,
            id: null,
          });
          invalidate();
          draw();
        } catch (error) {
          status(error.message || "Não foi possível abrir a imagem.", true);
        }
      }
    } finally {
      busy = false;
      mode.disabled = false;
      draw();
    }
  };
  window.onlineOptions
    .then((data) =>
      document
        .getElementById("image-soundtrack")
        .replaceChildren(
          ...data.soundtracks.map((item) => new Option(item.label, item.value)),
        ),
    )
    .catch(() => {});
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (busy || !valid()) return;
    busy = true;
    invalidate();
    draw();
    mode.disabled = true;
    const currentVersion = version;
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id && item.expires > Date.now()) continue;
        status(`Enviando imagem ${i + 1} de ${items.length}…`);
        const response = await fetch("/api/uploads/images", {
          method: "POST",
          headers: { "content-type": item.file.type },
          body: item.file,
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Falha no upload.");
        item.id = data.id;
        item.expires = data.expires;
      }
      const body = {
        ...Object.fromEntries(new FormData(form)),
        mode: mode.value,
        images: items.map((item) => ({ id: item.id, seconds: item.seconds })),
      };
      const data = await api("/api/prepare-images", "POST", body);
      if (currentVersion !== version) {
        status("Os ajustes mudaram. Prepare a prévia novamente.");
        return;
      }
      snapshot = data.id;
      window.showPreview(data.job, "image-player");
      renderButton.disabled = false;
      document.getElementById("image-preview-note").textContent =
        `Prévia pronta · ${data.job.durationInFrames / 30} segundos. O MP4 usará esta ordem, estes tempos e esta trilha.`;
      status("Prévia pronta. Confira as imagens e o áudio antes de gerar.");
    } catch (error) {
      status(error.message, true);
    } finally {
      busy = false;
      mode.disabled = false;
      draw();
    }
  };
  renderButton.onclick = () =>
    action(renderButton, async () => {
      if (!snapshot) return;
      await api("/api/renders", "POST", { snapshot });
      status("Vídeo na fila. Acompanhe em Meus vídeos.");
      navigate("/videos");
    });
})();
