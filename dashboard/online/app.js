const $ = (id) => document.getElementById(id);
const form = $("create-form");
let snapshot = null;
let busy = false;
let selectionVersion = 0;
const status = (message, error = false) => {
  $("status").textContent = message;
  $("status").classList.toggle("error", error);
};
async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      `${data.error || "Falha na solicitação."}${data.requestId ? ` Referência: ${data.requestId}` : ""}`,
    );
  return data;
}
const values = () => Object.fromEntries(new FormData(form));
function saveForm() {
  try {
    sessionStorage.setItem("rdb-form-v1", JSON.stringify(values()));
  } catch {}
}
function visibility() {
  const standingsOnly = ["indycar", "stock-pro", "stock-light"].includes(
    form.elements.category.value,
  );
  for (const option of form.elements.template.options) {
    option.disabled = standingsOnly
      ? option.value !== "source-driver-standings"
      : option.value === "source-constructor-standings" &&
        form.elements.category.value !== "f1";
  }
  if (form.elements.template.selectedOptions[0]?.disabled)
    form.elements.template.value = "source-driver-standings";
  $("category-note").hidden = !standingsOnly;
  const template = form.elements.template.value;
  $("event-fields").hidden = template !== "source-results";
  $("article-fields").hidden = template !== "editorial";
}
function invalidate() {
  snapshot = null;
  selectionVersion++;
  $("render").disabled = true;
  $("preview-note").textContent =
    "Os ajustes mudaram. Prepare novamente antes de gerar o MP4.";
  visibility();
  saveForm();
}
form.elements.season.value = new Date().getFullYear();
try {
  const saved = JSON.parse(sessionStorage.getItem("rdb-form-v1") || "{}");
  for (const [key, value] of Object.entries(saved))
    if (
      form.elements[key] &&
      !["eventUrl", "articleUrl", "soundtrackPath"].includes(key)
    )
      form.elements[key].value = value;
} catch {}
form.addEventListener("input", invalidate);
form.addEventListener("change", (event) => {
  if (["season", "category"].includes(event.target.name)) {
    form.elements.eventUrl.replaceChildren(
      new Option("Busque os eventos da temporada", ""),
    );
    form.elements.articleUrl.replaceChildren(
      new Option("Busque notícias da fonte oficial", ""),
    );
  }
  invalidate();
});
async function action(button, fn) {
  button.disabled = true;
  try {
    await fn();
  } catch (error) {
    status(error.message, true);
  } finally {
    button.disabled = false;
  }
}
$("load-events").onclick = () =>
  action($("load-events"), async () => {
    const version = selectionVersion;
    status("Consultando eventos oficiais…");
    const { result } = await api(
      `/api/events?${new URLSearchParams({ season: form.elements.season.value, category: form.elements.category.value })}`,
    );
    if (version !== selectionVersion) return;
    form.elements.eventUrl.replaceChildren(
      ...result.map(
        (event) =>
          new Option(
            event.label || event.name,
            event.url || event.value || event.id,
          ),
      ),
    );
    invalidate();
    status(result.length ? "Eventos carregados." : "Nenhum evento disponível.");
  });
$("load-editorial").onclick = () =>
  action($("load-editorial"), async () => {
    const version = selectionVersion;
    status("Consultando notícias oficiais…");
    const { result } = await api(
      `/api/editorial?${new URLSearchParams({ season: form.elements.season.value, category: form.elements.category.value })}`,
    );
    if (version !== selectionVersion) return;
    const articles = result.articles || [];
    form.elements.articleUrl.replaceChildren(
      ...articles.map(
        (article) =>
          new Option(
            article.title || article.headline,
            article.url || article.articleUrl,
          ),
      ),
    );
    invalidate();
    status(
      articles.length ? "Notícias carregadas." : "Nenhuma notícia disponível.",
    );
  });
form.onsubmit = (event) => {
  event.preventDefault();
  if (busy) return;
  action($("prepare"), async () => {
    busy = true;
    const version = selectionVersion;
    try {
      snapshot = null;
      $("render").disabled = true;
      status("Preparando dados da fonte oficial…");
      const data = await api("/api/prepare", "POST", values());
      if (version !== selectionVersion) {
        status("Os ajustes mudaram durante a preparação. Prepare novamente.");
        return;
      }
      snapshot = data.id;
      window.showPreview(data.job);
      $("render").disabled = false;
      $("preview-note").textContent =
        "Prévia pronta. O MP4 usará exatamente estes dados e ajustes.";
      status("Prévia pronta. Confira os dados e o áudio antes de gerar.");
    } finally {
      busy = false;
    }
  });
};
$("render").onclick = () =>
  action($("render"), async () => {
    if (!snapshot) return;
    await api("/api/renders", "POST", { snapshot });
    status(
      "Vídeo na fila. Você pode acompanhar em Meus vídeos ou fechar o navegador.",
    );
    navigate("/videos");
  });
const labels = {
  queued: "Na fila",
  rendering: "Renderizando",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};
const date = (value) => new Date(value).toLocaleString("pt-BR");
let lastList = "";
const videoCards = new Map();
let latestListRequest = 0;
async function refreshVideos() {
  const request = ++latestListRequest;
  const data = await api("/api/renders");
  if (request !== latestListRequest) return;
  $("storage").textContent =
    `MP4 armazenados: ${(data.bytes / 1024 / 1024).toFixed(1)} MB`;
  const signature = JSON.stringify(data);
  if (signature === lastList) return;
  lastList = signature;
  const nodes = data.renders.map((row) => {
    const rowSignature = JSON.stringify(row);
    const cached = videoCards.get(row.id);
    if (cached?.signature === rowSignature) return cached.node;
    const card = document.createElement("article");
    card.className = "video-card";
    const title = document.createElement("h2");
    title.textContent = row.title;
    card.append(title);
    const info = document.createElement("p");
    info.textContent = `${labels[row.status]} · ${date(row.created)}`;
    card.append(info);
    const reference = document.createElement("small");
    reference.textContent = `Referência: ${row.id}`;
    card.append(reference);
    if (row.error) {
      const error = document.createElement("p");
      error.textContent =
        row.error === "interrupted"
          ? "O serviço reiniciou durante este render. Gere novamente."
          : row.error === "render_timeout"
            ? "O render atingiu o limite de 30 minutos."
            : "Falha na renderização. Tente gerar novamente; use a referência para consultar os logs.";
      card.append(error);
    }
    if (row.status === "rendering") {
      const progress = document.createElement("progress");
      progress.max = 1;
      progress.value = row.progress;
      progress.setAttribute("aria-label", "Progresso do render");
      card.append(progress);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    card.append(actions);
    const button = (label, fn) => {
      const node = document.createElement("button");
      node.textContent = label;
      node.onclick = () =>
        action(node, async () => {
          await fn();
          lastList = "";
          await refreshVideos();
        });
      actions.append(node);
    };
    if (["queued", "rendering"].includes(row.status))
      button("Cancelar", () => api(`/api/renders/${row.id}/cancel`, "POST"));
    else
      button("Gerar novamente", () =>
        api(`/api/renders/${row.id}/retry`, "POST"),
      );
    if (row.available) {
      const link = document.createElement("a");
      link.href = `/api/renders/${row.id}/file?download`;
      link.textContent = "Baixar MP4";
      actions.append(link);
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "none";
      video.playsInline = true;
      video.src = `/api/renders/${row.id}/file`;
      card.append(video);
      const expiry = document.createElement("p");
      expiry.textContent = `${(row.bytes / 1024 / 1024).toFixed(1)} MB · Expira em ${date(row.expires)}`;
      card.append(expiry);
      button("Excluir MP4", async () => {
        if (
          confirm(
            "Excluir este MP4? Os dados continuarão salvos para gerar novamente.",
          )
        ) {
          const result = await api(`/api/renders/${row.id}`, "DELETE");
          status(
            `${result.removed} arquivo removido; ${result.failed.length} falha(s).`,
          );
        }
      });
    } else if (row.status === "completed") {
      const unavailable = document.createElement("p");
      unavailable.textContent =
        "MP4 expirado ou excluído. Os dados continuam salvos.";
      card.append(unavailable);
    }
    videoCards.set(row.id, { signature: rowSignature, node: card });
    return card;
  });
  if (!nodes.length) {
    const empty = document.createElement("p");
    empty.textContent =
      "Nenhum vídeo ainda. Prepare seu primeiro Short em Criar vídeo.";
    nodes.push(empty);
  }
  const list = $("video-list");
  const wanted = new Set(nodes);
  for (const child of [...list.children])
    if (!wanted.has(child)) child.remove();
  nodes.forEach((node, index) => {
    if (list.children[index] !== node)
      list.insertBefore(node, list.children[index] || null);
  });
  const ids = new Set(data.renders.map((row) => row.id));
  for (const id of videoCards.keys()) if (!ids.has(id)) videoCards.delete(id);
}
$("delete-all").onclick = () =>
  action($("delete-all"), async () => {
    if (
      !confirm(
        "Excluir todos os MP4 concluídos? Isso inclui todo o histórico. Os dados e os renders ativos serão preservados.",
      )
    )
      return;
    const data = await api("/api/renders/completed", "DELETE");
    status(
      `${data.removed} arquivo(s) removido(s), ${(data.bytes / 1024 / 1024).toFixed(1)} MB liberados. ${data.failed.length} falha(s).`,
      data.failed.length > 0,
    );
    lastList = "";
    await refreshVideos();
  });
function route() {
  const path = location.pathname;
  for (const id of ["create", "videos", "settings"])
    $(id).hidden =
      id !==
      (path === "/videos"
        ? "videos"
        : path === "/settings"
          ? "settings"
          : "create");
  document.querySelectorAll("nav a").forEach((a) => {
    if (a.pathname === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (path === "/videos")
    refreshVideos().catch((error) => status(error.message, true));
}
function navigate(path) {
  history.pushState(null, "", path);
  route();
}
document.querySelectorAll("a[data-nav]").forEach(
  (a) =>
    (a.onclick = (event) => {
      if (event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      navigate(a.pathname);
    }),
);
window.addEventListener("popstate", route);
setInterval(() => {
  if (location.pathname === "/videos" && !document.hidden)
    refreshVideos().catch((error) => status(error.message, true));
}, 3000);
api("/api/options")
  .then((data) => {
    $("account").textContent = `Conta conectada: ${data.email}`;
    $("soundtrack").replaceChildren(
      ...data.soundtracks.map((item) => new Option(item.label, item.value)),
    );
    try {
      const saved = JSON.parse(sessionStorage.getItem("rdb-form-v1") || "{}");
      if (data.soundtracks.some((item) => item.value === saved.soundtrackPath))
        $("soundtrack").value = saved.soundtrackPath;
    } catch {}
  })
  .catch((error) => status(error.message, true));
visibility();
route();
