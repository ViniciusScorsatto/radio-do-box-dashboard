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

O fluxo online habilita Formula 1, Formula 2, Formula 3 e F1 Academy já suportados pelos coletores, além dos campeonatos de pilotos de IndyCar, Stock Car Pro Series e Stock Light. Essas três categorias oferecem somente campeonato de pilotos; o formulário ajusta o template automaticamente. Construtores ficam limitados à F1. Agenda/PNG, comparações, palpites, importação por texto e outras telas locais continuam nos comandos locais. Não são publicados pelo servidor online.

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

`APP_ONLINE=true` é definido pelo inicializador. Não configurar `F1_API_KEY`, chaves de IA/TTS ou URLs alternativas de fonte. Stock reutiliza as consultas públicas do próprio site Veloci/Paddock, sem exigir uma chave de API sua. O fluxo online só permite os hosts oficiais conhecidos e rejeita redirects para impedir que URLs de entrada consultem destinos arbitrários.

O health check público é `/healthz`. A aplicação inicia HTTP somente depois de o worker ficar pronto. Falha de servidor/worker encerra o serviço para reinício pelo Railway. SIGTERM cancela o render e tem limite de 15 segundos antes de SIGKILL; renders interrompidos viram `failed` na próxima inicialização.

Referências de configuração: [Railway config-as-code](https://docs.railway.com/config-as-code/reference), [health checks](https://docs.railway.com/deployments/healthchecks), [Remotion Docker](https://www.remotion.dev/docs/docker), [openid-client](https://github.com/panva/openid-client).

## Uso

Em **Criar vídeo**, selecione temporada/categoria/template, carregue o evento ou notícia quando necessário e escolha a trilha. Clique **Preparar prévia**, confira os dados e então **Gerar MP4**. Alterar qualquer ajuste exige nova preparação. As duas contas compartilham o histórico; cada aba prepara seu próprio snapshot. O formulário é mantido durante a navegação e os ajustes são recuperados na mesma aba; após atualizar a página, carregue o evento e prepare novamente.

**Meus vídeos** acompanha a fila, permite download/reprodução, cancelamento, nova renderização e exclusão dos MP4. A exclusão em lote captura todos os concluídos no início da operação. Snapshots e histórico permanecem. Arquivos expiram 48 horas após a conclusão; downloads são bloqueados imediatamente e os arquivos são removidos na inicialização e a cada hora. O total mostrado mede somente MP4.

Limites: 20 renders ativos/aguardando; 30 minutos por render (encerramento forçado do worker aos 31 minutos caso Chromium fique travado); preparação serial em subprocesso com limite de 2 minutos. Falha de coleta gera erro, sem inventar dados. Sessões Google duram 7 dias e podem ser revogadas em **Sair**. Se a sessão expirar durante o uso, abra novamente a página e entre.

## Persistência, assets e atualizações

`/data/app.sqlite` guarda snapshots, fila, sessões e estados OAuth; `/data/renders` guarda arquivos finais/parciais. Os diretórios `tmp` e `generated` são reservados no volume. Banco começa vazio. Nenhum job local é importado e nenhum segredo, banco, vídeo ou arquivo gerado entra na imagem.

Os templates, configurações, trilhas, fontes e imagens distribuídos pertencem à imagem/Git. Não há edição ou upload de assets online nesta versão; não há necessidade de seed mutável ou cache Python/FastF1. O fluxo habilitado lê os assets distribuídos e guarda as fotos oficiais da Stock em `/data/public/online-assets`, com nomes derivados do conteúdo. Prévia e renderer leem os mesmos arquivos privados. As imagens não são apagadas ao excluir/expirar MP4, preservando os snapshots. Falha no download mantém o fallback visual existente de iniciais. Nenhuma imagem online é gravada no repositório. Preserve os arquivos referenciados por snapshots: ao mudar uma imagem/música, use novo nome em vez de sobrescrever. Mudanças de template entre deploys podem alterar a aparência de um render repetido; para reproduzir uma versão antiga exatamente, restaure a mesma revisão da imagem.

As permissões de uso/republicação dos dados, fontes, músicas e imagens continuam sob responsabilidade do projeto. A migração não adiciona nem concede licenças. Mudanças ou bloqueios dos sites podem exigir manutenção dos coletores.

## Logs e diagnóstico

Logs JSON em stdout contêm evento, timestamp, `requestId`/`renderId`, estado e duração quando aplicável. A interface mostra referências para correlacionar erros. Não há tokens, códigos OAuth, bodies ou snapshots completos nos logs. Guarde logs do Railway junto com a referência antes de repetir uma falha. Falhas da coleta e da renderização aparecem como etapas separadas.

## Backup e restauração

```sh
APP_DATA_DIR=/data npm run backup:online -- /tmp/radio-do-box-backup.sqlite
```

O script usa a API SQLite de backup, incluindo conteúdo ainda no WAL; nunca copie `app.sqlite` ativo sozinho. O destino não pode existir. Transfira o backup para armazenamento externo privado; `/tmp` ou o próprio volume não são proteção contra perda do volume. MP4 fica fora por ser temporário. O comando também cria o diretório `<destino>.sqlite.assets` (para um destino terminado em `.sqlite`) com os retratos persistentes; guarde ambos. Assets/configurações distribuídos são recuperados da mesma revisão Git/imagem.

Para restaurar: parar o serviço, preservar o volume antigo, criar volume vazio e copiar o backup como `/data/app.sqlite` e o conteúdo de seu diretório `.assets` para `/data/public/online-assets`. Antes de reabrir acesso, executar com `node:sqlite`:

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

### Categorias restauradas no painel online

IndyCar, Stock Car Pro Series e Stock Light estão disponíveis em **Categoria**, usando **Mundial / Campeonato de pilotos**. As três passam pelos coletores que já existiam localmente, sem API-Sports. Resultados de sessões e notícias continuam limitados às categorias que têm esses coletores.

A coleta real e a renderização PNG foram verificadas em Linux para IndyCar (33 pilotos), Stock Pro (32) e Stock Light (20). A suíte completa passou com 30 testes. As fotos Stock usam o host público Paddock também na porta HTTPS 9091; a validação mantém host, porta, caminho, formato e tamanho restritos. O backup agora inclui banco e retratos persistentes.

## Segurança após publicação — revisão de 05/10/2026

A aplicação exige sessão Google de um dos dois e-mails verificados para APIs,
player, imagens e vídeos. O callback valida state, nonce e PKCE; mutações exigem
Origin igual a PUBLIC_URL. O proxy não é usado como fonte de identidade para
limites: X-Forwarded-For enviado pelo cliente não altera os contadores.

Proteções adicionais:

- Login: orçamento global de 10 inícios e 30 callbacks por minuto; estados OAuth
  pendentes limitados a 100. Um ataque pode esgotar esse orçamento e impedir login
  temporariamente, mas não cria estados ilimitados. Sessões existentes continuam funcionando.
- Cada conta: 60 operações de coleta/preparação por hora e 60 pedidos de render
  por janela de 24 horas. Tentativas inválidas também consomem orçamento.
- Fila: no máximo 20 ativos e 120 renders criados nas últimas 24 horas no total;
  cancelar ou repetir não devolve orçamento. Contadores persistem no SQLite.
- Coleta e renderer recebem somente variáveis necessárias; não recebem segredo
  Google nem tokens Railway. Coleta tem heap de 384 MiB e prazo de 2 minutos
  (heap não limita toda a memória nativa). Renderer permanece serializado.
- Novos trabalhos recusados com menos de 512 MiB livres no volume; isso é uma
  reserva preventiva, não uma cota de disco ou garantia contra esgotamento.
- APIs rejeitam navegação cross-site indicada por Fetch Metadata; POSTs com JSON
  exigem o Content-Type correto, objeto e limite de 32 KiB.
- HTTPS persistente via HSTS, bloqueio de plugins e permissões de câmera,
  microfone e localização. Timeouts e conexões HTTP também têm limites.
- Snapshots sem renders associados são removidos após sete dias; vídeos continuam
  com retenção de 48 horas. Histórico e retratos ainda precisam de acompanhamento
  de crescimento do volume em uso prolongado.

Configuração operacional no Railway (não é alterada pelo código):

1. Em Workspace → Usage, definir alerta de gastos e Hard Limit de compute adequado
   ao orçamento. O hard limit pode desligar os serviços até o próximo ciclo:
   https://docs.railway.com/pricing/cost-control
2. Manter apenas uma réplica e volume privado montado em /data. Dimensionar os
   limites de CPU/memória conforme os renders; validar disponibilidade após ajustá-los.
3. Ativar MFA nas contas Google, GitHub e Railway. Manter a lista de e-mails restrita
   às duas pessoas; nenhum segredo deve ser incluído em VITE_* ou arquivos públicos.
4. Fazer backup periódico do SQLite e do diretório de retratos conforme este guia.
   Para invalidar todas as sessões em emergência, executar no serviço:
   `node --input-type=module -e 'import {openStore} from "./scripts/online/store.mjs"; const s=openStore(process.env.APP_DATA_DIR); s.db.exec("DELETE FROM sessions; DELETE FROM oauth;"); s.db.close();'`
   Remover também o e-mail comprometido de ALLOWED_EMAILS, se necessário.

Limites desta revisão: inspeção de código, testes locais e requisições públicas
somente de leitura; não houve teste de invasão nem teste de carga em produção.
A proteção contra DDoS volumétrico depende da borda/provedor e não desses limites.
Os itens de execução sem privilégios, respostas de origem e crescimento de dados
foram tratados na complementação abaixo. Antes de ampliar o acesso a terceiros,
reavaliar o modelo de permissões compartilhadas e as cotas para múltiplos usuários.

Validação desta alteração: 33 testes passaram, build online e TypeScript online
passaram, dependências Remotion alinhadas em 4.0.532 e npm audit sem alertas no
momento da revisão. A imagem Docker compilou e concluiu um render real de Stock Pro
com o supervisor e os ambientes restritos. Isso não garante ausência de vulnerabilidades desconhecidas.


### Complementação da segurança

- O comando de início permanece `node scripts/online/start.mjs`, inclusive no Railway.
  Em Linux, quando iniciado como root, ele aceita somente `APP_DATA_DIR=/data`,
  ajusta o proprietário desse volume sem seguir symlinks nem atravessar outros
  dispositivos e muda definitivamente para UID/GID 1000, removendo grupos extras.
  Isso ocorre antes de abrir o banco ou iniciar servidor, worker e Chrome. O código
  em `/app` continua pertencendo a root e não pode ser sobrescrito pela aplicação.
  O bootstrap precisa começar como root porque o Railway monta volumes como root;
  não configurar um start command que execute `http.mjs` ou `worker.mjs` diretamente.
  A criação de arquivos usa `umask 077`; dados anteriores e seus conteúdos são preservados.
- HTML e JavaScript das fontes têm limite de 8 MiB; JSON das consultas públicas Stock,
  2 MiB. Contamos bytes do stream decodificado e abortamos ao ultrapassar o limite,
  mesmo sem Content-Length ou com compressão. Redirecionamentos das fontes online
  são recusados, incluindo Stock. Rankings Stock têm no máximo 100 entradas.
- Cada snapshot pode ter até 1 MiB, com orçamento total de 256 MiB de JSON salvo.
  O histórico admite 50.000 renders. Ao atingir essas cotas, novas gravações são
  bloqueadas sem apagar o histórico; exportação/arquivamento exige intervenção do
  administrador. Esses valores limitam payloads/registros, não o tamanho físico
  exato do SQLite, que inclui índices, páginas livres e WAL.
- Retratos têm cota conservadora de 512 MiB, contando arquivos temporários e
  reservas para gravações concorrentes. Quando a foto não puder ser armazenada,
  o template mantém o fallback de iniciais. Referências dos snapshots existentes
  são preservadas. Retratos sem referência e temporários com mais de sete dias
  são removidos na inicialização e na manutenção horária. A coleta e essa manutenção
  não se sobrepõem para evitar apagar uma foto em preparação.
- “Meus vídeos” retorna 30 registros por página, com total e armazenamento global.
  Os botões Anterior/Próxima permitem consultar todo o histórico sem carregar tudo
  no navegador. A exclusão de todos os MP4 e a expiração continuam abrangendo todas
  as páginas.

Validação complementar: suíte de 37 testes, TypeScript online, build Docker e render
real de Stock Pro passaram. Foi verificado UID 1000 em execução, escrita em /data,
recusa de escrita em /app e preservação do destino de symlink durante a migração.
Coletas reais com UID 1000 passaram para F1 2025 (21 pilotos) e Stock Pro 2026
(32 pilotos), respeitando os novos limites.
A paginação foi exercitada no navegador integrado em localhost, com fixture de 65
vídeos: 30/30/5 registros, avanço/retorno, botão final desabilitado e nenhum erro
relevante no console. Tela de 390×844 sem transbordamento horizontal. As configurações
de gastos, MFA e backup da conta Railway continuam sendo ações externas ao código.


## Short com imagens próprias

A área **Short com imagens** (`/images`) aceita artes criadas fora do dashboard.

- **Uma imagem:** vídeo fixo de 12 segundos.
- **Sequência:** de 2 a 5 imagens, de 1 a 60 segundos inteiros por imagem,
  respeitando o máximo de 60 segundos no total. Antes/Depois altera a ordem e
  Remover retira uma imagem da edição.
- Arquivos JPG ou PNG estáticos, exatamente 1080 × 1920 pixels após aplicar a
  orientação EXIF, até 8 MiB cada. O servidor decodifica e regrava como PNG,
  removendo metadados. Nenhuma arte é cortada nem recebe títulos sobrepostos.
  O nome do vídeo aparece apenas no histórico.
- A prévia e o MP4 compartilham a mesma composição, ordem e durações. A trilha
  selecionada toca continuamente, repete quando necessário e tem fade-out no
  último segundo. Volume zero omite a trilha.
- O vídeo utiliza a fila existente, os mesmos limites de uso e o download privado.
  Alterar imagens, ordem, tempos ou música exige preparar uma nova prévia.

Segurança e retenção: uploads exigem sessão e Origin válido, com limite de 60
arquivos por hora por conta e processamento serial de upload. A decodificação
usa um subprocesso sem credenciais, prazo de 15 segundos, heap de 192 MiB e
limite de pixels; o heap não limita toda a memória nativa do decodificador.
SVG, arquivos animados e formatos diferentes de JPG/PNG são recusados. O volume
reserva até 200 MiB para imagens normalizadas em `/data/uploads`, indexadas por
hash do conteúdo, sem aproveitar nomes/caminhos enviados pelo usuário.

Imagens expiram após 48 horas do upload ou da última renovação por render. A fila
renova esse prazo, e a conclusão o renova novamente para acompanhar a validade
do MP4. Arquivos de jobs ativos são preservados; a manutenção remove os expirados.
O histórico continua salvo, mas tentar renderizar com uma imagem expirada solicita
um novo envio. Rascunhos e arquivos escolhidos no navegador não sobrevivem ao
recarregamento da página; guarde os originais. O backup opcional anterior de
retratos não inclui esses uploads temporários.

A nova dependência `sharp` é instalada pelo `npm ci` do Docker. Nenhuma variável
Railway adicional é necessária. A alteração do SQLite é aditiva e preserva dados
existentes, criando somente a tabela de uploads.

Validação da área de imagens: 40 testes passaram (incluindo autenticação/Origin,
limites de bytes, formatos e dimensões, duração máxima e limpeza com jobs ativos),
build Docker e TypeScript online passaram. Foram gerados pela interface um MP4 de
imagem única de 12 segundos e outro de cinco imagens de 60 segundos, ambos em
1080×1920 a 30 FPS, com H.264/AAC. No segundo, os tempos 5/7/11/17/20 foram
verificados nos frames das transições; uma trilha de teste de três segundos
comprovou o loop, a continuidade entre imagens e o fade-out. Reordenação, remoção,
bloqueio de 61 segundos, prévia e acesso ao download foram conferidos no navegador
integrado. Tela de 390×844 sem transbordamento horizontal e sem erros de console
(apenas o aviso informativo de licenciamento do Remotion). O TypeScript global
continua com os três erros anteriores em F1LargeVideosComposition e
F1RacePredictionsComposition, fora da área online.
