# Rádio do Box — Shorts privados no Railway

Implementação na branch `codex/private-railway-dashboard`, criada após `git pull --ff-only origin main`. Este documento descreve o código F1; o guia de futebol foi usado apenas como referência. Nenhum deploy é feito pelos comandos de build/teste.

## Diagnóstico e adaptação

| Antes | Online | Aceitação |
| --- | --- | --- |
| Servidor HTTP local em `scripts/dashboard-server.mjs` | Serviço separado em `scripts/online` | Comandos locais preservados; endpoints locais ausentes online |
| `/f1-sources`, coletores dos sites oficiais | Resultados, pilotos, construtores F1 e notícias oficiais | Sem API-Sports, IA, TTS ou fallback de resultados fictícios |
| Arquivos `current-job.*.json` compartilhados | Snapshots JSON imutáveis em SQLite | Preparar outro vídeo não muda o anterior |
| Studio em localhost | Player integrado | Mesma composição e props do renderer, 1080×1920, 30 FPS, 360 frames |
| Render síncrono ligado à requisição | Worker supervisionado e fila persistente | HTTP 202; um render por vez; cancelamento, retry e recuperação |
| `out/` local | MP4 em `/data/renders` | Autenticação, HEAD/Range, expiração após 48h |
| Uma conta no guia | Lista de uma ou duas contas Google verificadas | `ALLOWED_EMAILS` cobre você e sua irmã |

O fluxo online habilita Formula 1, Formula 2, Formula 3 e F1 Academy já suportados pelos coletores. Construtores ficam limitados à F1. Agenda/PNG, comparações, palpites, importação por texto e outras telas locais continuam nos comandos locais. Não são publicados pelo servidor online.

## Executar e validar

O ambiente online requer **Node 24** (SQLite nativo). Os comandos locais continuam independentes deste servidor.

```sh
npm ci
npx tsc -p tsconfig.online.json
npm run test:online
node --test scripts/lib/*.test.mjs
npm run build:online
docker build -t radio-do-box-online:test .
```

`npm run start:online` exige as variáveis abaixo, mesmo em teste local. Não há modo de produção que ignore login. `.env` não é carregado por esse comando.

## Configurar Google e Railway

1. No Google Cloud, configurar consentimento OAuth; se estiver em teste, adicionar as duas contas como usuários de teste.
2. Criar um cliente OAuth **Web application**, escopos `openid email`.
3. Criar o serviço Railway a partir desta branch quando ela estiver no GitHub. O build usa `Dockerfile` e `railway.toml`.
4. Adicionar um volume persistente com mount path **`/data`**. Manter **uma réplica** e desativar **Serverless/suspensão**; não escalar horizontalmente.
5. Gerar um domínio HTTPS e configurar a porta de destino **4321** (ou a mesma porta definida em `PORT`). A porta do Remotion é interna e não deve ser publicada.
6. Cadastrar no Google exatamente `https://SEU-DOMINIO/auth/google/callback`.
7. Configurar as variáveis Railway:

| Variável | Valor |
| --- | --- |
| `PUBLIC_URL` | `https://SEU-DOMINIO`, sem barra final ou caminho |
| `GOOGLE_CLIENT_ID` | ID do cliente Web |
| `GOOGLE_CLIENT_SECRET` | Segredo do cliente Web |
| `ALLOWED_EMAILS` | `seu-email@gmail.com,email-da-irma@gmail.com` |
| `APP_DATA_DIR` | `/data` |
| `PORT` | `4321` |

`APP_ONLINE=true` é definido pelo inicializador. Não configurar `F1_API_KEY`, chaves de IA/TTS ou URLs alternativas de fonte. O fluxo online só permite os hosts oficiais conhecidos e rejeita redirects para impedir que URLs de entrada consultem destinos arbitrários.

O health check público é `/healthz`. A aplicação inicia HTTP somente depois de o worker ficar pronto. Falha de servidor/worker encerra o serviço para reinício pelo Railway. SIGTERM cancela o render e tem limite de 15 segundos antes de SIGKILL; renders interrompidos viram `failed` na próxima inicialização.

Referências de configuração: [Railway config-as-code](https://docs.railway.com/config-as-code/reference), [health checks](https://docs.railway.com/deployments/healthchecks), [Remotion Docker](https://www.remotion.dev/docs/docker), [openid-client](https://github.com/panva/openid-client).

## Uso

Em **Criar vídeo**, selecione temporada/categoria/template, carregue o evento ou notícia quando necessário e escolha a trilha. Clique **Preparar prévia**, confira os dados e então **Gerar MP4**. Alterar qualquer ajuste exige nova preparação. As duas contas compartilham o histórico; cada aba prepara seu próprio snapshot. O formulário é mantido durante a navegação e os ajustes são recuperados na mesma aba; após atualizar a página, carregue o evento e prepare novamente.

**Meus vídeos** acompanha a fila, permite download/reprodução, cancelamento, nova renderização e exclusão dos MP4. A exclusão em lote captura todos os concluídos no início da operação. Snapshots e histórico permanecem. Arquivos expiram 48 horas após a conclusão; downloads são bloqueados imediatamente e os arquivos são removidos na inicialização e a cada hora. O total mostrado mede somente MP4.

Limites: 20 renders ativos/aguardando; 30 minutos por render (encerramento forçado do worker aos 31 minutos caso Chromium fique travado); preparação serial em subprocesso com limite de 2 minutos. Falha de coleta gera erro, sem inventar dados. Sessões Google duram 7 dias e podem ser revogadas em **Sair**. Se a sessão expirar durante o uso, abra novamente a página e entre.

## Persistência, assets e atualizações

`/data/app.sqlite` guarda snapshots, fila, sessões e estados OAuth; `/data/renders` guarda arquivos finais/parciais. Os diretórios `tmp` e `generated` são reservados no volume. Banco começa vazio. Nenhum job local é importado e nenhum segredo, banco, vídeo ou arquivo gerado entra na imagem.

Os templates, configurações, trilhas, fontes e imagens distribuídos pertencem à imagem/Git. Não há edição ou upload de assets online nesta versão; não há necessidade de seed mutável ou cache Python/FastF1. O fluxo habilitado lê os assets existentes e não baixa imagens para o repositório. Preserve os arquivos referenciados por snapshots: ao mudar uma imagem/música, use novo nome em vez de sobrescrever. Mudanças de template entre deploys podem alterar a aparência de um render repetido; para reproduzir uma versão antiga exatamente, restaure a mesma revisão da imagem.

As permissões de uso/republicação dos dados, fontes, músicas e imagens continuam sob responsabilidade do projeto. A migração não adiciona nem concede licenças. Mudanças ou bloqueios dos sites podem exigir manutenção dos coletores.

## Logs e diagnóstico

Logs JSON em stdout contêm evento, timestamp, `requestId`/`renderId`, estado e duração quando aplicável. A interface mostra referências para correlacionar erros. Não há tokens, códigos OAuth, bodies ou snapshots completos nos logs. Guarde logs do Railway junto com a referência antes de repetir uma falha. Falhas da coleta e da renderização aparecem como etapas separadas.

## Backup e restauração

```sh
APP_DATA_DIR=/data npm run backup:online -- /tmp/radio-do-box-backup.sqlite
```

O script usa a API SQLite de backup, incluindo conteúdo ainda no WAL; nunca copie `app.sqlite` ativo sozinho. O destino não pode existir. Transfira o backup para armazenamento externo privado; `/tmp` ou o próprio volume não são proteção contra perda do volume. MP4 fica fora por ser temporário; assets/configurações são recuperados da mesma revisão Git/imagem.

Para restaurar: parar o serviço, preservar o volume antigo, criar volume vazio e copiar o backup como `/data/app.sqlite`. Antes de reabrir acesso, executar com `node:sqlite`:

```js
import {DatabaseSync} from 'node:sqlite';
const db = new DatabaseSync('/data/app.sqlite');
console.log(db.prepare('PRAGMA integrity_check').get());
db.exec('DELETE FROM sessions; DELETE FROM oauth; UPDATE renders SET available=0,bytes=0;');
db.close();
```

Restaurar a mesma imagem, reiniciar e gerar um vídeo de teste. O backup contém dados de sessão e deve ser protegido mesmo depois da revogação.

## Verificação e limites da entrega

Os testes automatizados cobrem snapshots, fila, recuperação, cancelamento, limite de fila, sessões, allowlist, estado OAuth de uso único, origens, acesso não autenticado, streaming/HEAD/Range, expiração, exclusão de 35 arquivos com preservação de jobs ativos e backup/restauração.

A validação real de Google (inclusive Safari/Chrome em celular sem login prévio), domínio HTTPS, volume e recursos no Railway deve ser feita após configurar e publicar o serviço. Testes com fixtures não equivalem a login real. Não há estimativa de custo Railway baseada no projeto de futebol.

O check TypeScript online é separado porque a base já tem três erros em `F1LargeVideosComposition` e `F1RacePredictionsComposition`, fora do grafo online. Os pacotes Remotion foram fixados em 4.0.438, a versão já instalada. O audit informa alertas transitivos em ferramentas Remotion/build (incluindo ws e extract-zip); o Studio não é exposto e o Chromium vem do build, mas a atualização coordenada dessas dependências permanece pendente antes de ampliar o acesso ou aceitar arquivos externos.

### Evidências locais desta implementação

- Build Docker Linux/ARM64 completo, com navegador baixado no build e bundle online sem jobs locais.
- Coleta real de eventos e mundial de pilotos F1 2025 no Formula1.com a partir do container, sem chave de API.
- PNGs reais das cinco variações: corrida, classificação/grid, pilotos, construtores e editorial.
- MP4 real com dados fictícios: 360 frames / 12 segundos, 1080×1920; 60,3 segundos de render; 1.091.646 bytes. Esse tempo é do Docker local, não é previsão de Railway.
- Player no navegador com fixture do projeto, sem erros de console; navegação e volta preservam a prévia. Conferência em 1280×900 e 390×844; na tela estreita `scrollWidth === clientWidth`.
- Login Google e Safari/Chrome em dispositivos físicos não foram testados; nenhuma conta/infraestrutura externa foi configurada ou publicada.
- Serviço completo (supervisor + HTTP + worker) testado com snapshot obtido do site, render serial, MP4 concluído e download autenticado após recriar o container com o mesmo volume. O arquivo persistido tinha 914.552 bytes, vídeo H.264 1080×1920 e áudio AAC.
- Uma amostra durante esse render usou aproximadamente 980 MiB de memória e 249% de CPU no Docker local. Não representa pico medido nem garantia de capacidade/preço em outra máquina.
