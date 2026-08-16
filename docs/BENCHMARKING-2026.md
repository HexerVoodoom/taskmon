# Dossiê Taskmon — Benchmarking e análise (ago/2026)

> 30 rodadas de benchmarking + análise sob quatro lentes: psicologia, gamificação,
> design de produto e design de UX.
> Base: 48 buscas em fontes de pesquisa, imprensa especializada e análise de
> concorrentes, cruzadas com o código atual (`src/`, ~31,7k linhas).

---

## Tese

O Taskmon é um Tamagotchi muito bem construído com uma camada de tarefas fina
demais para a promessa. O motor emocional (pet, cuidado, evolução, três mundos
temáticos) está pronto e é melhor que o da maioria dos concorrentes de tarefas
familiares. O que está faltando não é conteúdo — é **acoplamento**: a vida real
quase não move a economia do jogo, a mãe não existe como papel dentro do produto,
e o sistema pune com mais nitidez do que recompensa.

As três correções de maior alavancagem, em ordem:

1. **Ligar a economia à vida real.** Hoje Bits vêm só de minijogo. Uma criança
   pode rodar o loop econômico inteiro (Bits → loja → comida → energia) sem fazer
   uma única tarefa real. O minijogo compete com a tarefa em vez de recompensá-la.
2. **Criar o papel de responsável.** São 3 saves, 0 papéis. Todo o trabalho de
   cadastrar, lembrar, verificar e mediar continua fora do app — que é exatamente
   como apps de tarefa familiar morrem.
3. **Inverter a assimetria de punição.** Perda de coração na virada, regressão de
   fase em HP 0, −1 dia perfeito, coração por cocô não limpo. Para 4 e 8 anos,
   isso pune falhas de agenda que quem controla é o adulto.

---

## Retrato do produto hoje

| Dimensão | Estado |
|---|---|
| Núcleo | Pet virtual (3 pets × 3 fases, linear), cuidado diário (comida, banho, cocô, sono, carinho) |
| Tarefas | Cadastro livre com categorias e passos; meta por fase (1/3/5/6 por dia) |
| Economia | 💠 Bits **só de minijogos** → loja vende **só comida** → comida dá **+1 energia** |
| Minijogos | 7 (Masmorra, Dino, RoofRun, PPT, Bubble, FlowerCatch, WerewolfRun) |
| Perfis | 3 saves independentes **no mesmo aparelho** + 4ª casinha coletiva (só visual + carinho) |
| Nuvem | 1 blob por e-mail com os 3 perfis juntos (last-write-wins) |
| IA | Fala idle a cada 3 min via `/api/chat` (Groq), personalidade por pet |
| Instrumentação | Nenhuma |

**Onde o esforço recente foi:** minijogos, cenários, hub coletivo, arte.
**Onde o esforço não foi:** o elo entre a tarefa real e tudo o mais.

---

## Diagnóstico — quatro lentes

### 🧠 Psicologia

**P1 · A economia recompensa o jogo, não a vida.**
Bits vêm de minijogos; tarefas dão comida, que dá energia, que só serve para o
dia perfeito. O caminho mais curto para tudo que a criança quer (comprar na loja,
jogar mais) não passa por lavar a louça. Em economia de fichas (ABA), a ficha só
tem valor por causa do *backup reinforcer* — o que ela compra de verdade. Aqui a
ficha compra outro item do próprio jogo, em circuito fechado.

**P2 · Pune-se com mais nitidez do que se recompensa.**
Coração perdido na virada, HP 0 → regride de fase, −1 dia perfeito, −1 coração a
cada 6 h de cocô. Do outro lado: +1 energia por comida. A literatura de disciplina
positiva é consistente — consequência natural ensina, punição por omissão só
ensina a evitar o sistema. E o Habitica é o caso-limite documentado: gente
abandona por causa da mecânica de dano e da culpa que ela gera.

**P3 · Punição por algo que a criança não controla.**
Aos 4 e aos 8 anos a função executiva e a noção de tempo ainda estão em formação,
e a agenda é do adulto. Se a mãe não cadastrou tarefa, se foi dia de médico, se
dormiram na casa da avó — o pet perde coração assim mesmo. Isso não é firmeza, é
ruído.

**P4 · Sobrejustificação: cuidado com o que já é prazer.**
Recompensa extrínseca esperada corrói motivação intrínseca em atividades que a
pessoa já gosta (Lepper, Greene & Nisbett, com crianças de 3 a 5 anos). Para
tarefa doméstica chata, recompensa é apropriada e funciona. A regra prática:
**pague o que é chato, celebre o que já é amado.** Se "ler um livro" entrar na
mesma esteira de Bits que "guardar os brinquedos", o app cobra um preço na coisa
errada.

**P5 · A ameaça ao vínculo é potente demais para essa idade.**
Estudos de fMRI mostram que cuidar de criatura digital ativa circuitos de cuidado
parecidos com os de um ser vivo — é o que dá força ao produto. É também o que
torna "seu pet regrediu de fase" uma perda emocional real para uma criança de 4
anos, por um motivo que ela não entende.

### 🎮 Gamificação

**G1 · Octalysis desbalanceado.**
Forte em CD4 (Posse — o pet, a coleção de comida) e CD8 (Perda & Evitação — os
corações). Fraco justamente nos *white hat*: CD1 (Significado Épico — por que
existimos como família), CD3 (Criatividade — a criança quase não personaliza
nada) e CD5 (Social — três pessoas na mesma casa e três jogos solo). O desenho
atual gera urgência sem gerar orgulho.

**G2 · Não existe escudo.**
O *streak freeze* do Duolingo reduziu churn em 21% no grupo em risco. Aqui não há
equivalente: a vida real é irregular e a regra do dia perfeito não perdoa nada.

**G3 · Princípio de Premack invertido.**
Premack: a atividade preferida reforça a menos preferida. No Taskmon o minijogo
(preferido) é livre e a tarefa (não preferida) é a que tem porteiro. Está de
cabeça para baixo.

**G4 · Só existe o loop diário.**
Não há loop semanal (algo que só acontece no sábado, ritual de família) nem loop
de temporada (conteúdo que se renova). Kids perdem interesse em 2–3 semanas
quando a novidade acaba — é o motivo nº 1 documentado de abandono de app de
tarefa infantil, e o padrão que o Taskmon vai encontrar por volta da terceira
semana de uso constante.

### 📦 Produto

**Pr1 · Não existe o papel de responsável.**
Nenhuma visão da mãe sobre as duas filhas, nenhuma aprovação, nenhuma tarefa
cadastrada de fora do perfil. 70% das pessoas abandonam apps de tarefa doméstica
em 100 dias, e a razão apontada na pesquisa é precisa: *o app vira mais uma
tarefa da mãe*. Hoje o Taskmon está do lado errado dessa linha.

**Pr2 · Um aparelho, três perfis — teto estrutural.**
Trocar de perfil dá reload. O cloud save é um blob único por e-mail; se as duas
crianças usarem aparelhos diferentes com o mesmo e-mail, o último a salvar apaga
o outro. O merge precisa ser por perfil, com timestamp próprio.

**Pr3 · Zero instrumentação.**
Não há como saber se funcionou. Para uma família não é preciso analytics de
verdade — bastam cinco números numa tela.

**Pr4 · Superfície crescendo, núcleo parado.**
Sete minijogos e três mundos temáticos, contra um elo tarefa→economia que não
existe. É a mesma crítica que os usuários do Finch estão fazendo em 2026:
"continuam adicionando features divertidas e o app nem está estável".

**Pr5 · Chat de IA aberto para criança pequena é o maior risco do produto.**
Em 2026 a UNICEF publicou o brief sobre riscos de companheiros de IA para
crianças, a SB 243 da Califórnia entrou em vigor em 1º de janeiro, e a Common
Sense Media recomenda nenhum companion de IA para menores de 18. O Taskmon chama
um LLM a cada 3 minutos com personalidade de amigo. Não precisa morrer — precisa
de repertório fechado, sem memória emocional, sem linguagem de amizade exclusiva,
e desligado por padrão nos perfis infantis.

### ✏️ UX

**U1 · Texto é ruído para uma pré-leitora.**
Convenção do projeto é sempre PT-BR + EN. Para a criança de 4 anos os dois são
igualmente ilegíveis. NN/g é direto: para 3–5 anos, símbolo e ícone são o modo
primário de comunicação; texto entra depois.

**U2 · Alvos e gestos.**
Referência para criança é 2 × 2 cm (≈75 px) com folga entre botões, e evitar
gestos complexos como arrastar nas faixas mais novas. O carinho de esfregar ~2 s
é uma ideia excelente — tátil, recíproca, curativa — mas 2 s é longo para mãos
pequenas e o arrasto do Flower Catch é justamente o gesto que a literatura
desaconselha para os menores.

**U3 · O juice está no lugar errado.**
O ápice audiovisual do app é ganhar um minijogo. Concluir uma tarefa real — o
único momento que o produto existe para celebrar — é o mais silencioso. "Juice"
não muda as regras, muda o que o jogador sente; é a razão nº 1 de as pessoas
continuarem jogando. E na fórmula do Fogg (B = MAP), a celebração é o que
consolida o hábito.

**U4 · A melhor ideia do app está escondida.**
O cadeado de evolução — tocar no pet para travar a evolução e acumular dias — é
autonomia pura (SDT), controle de ritmo nas mãos da criança. Está enterrado numa
página secundária, sem explicação.

---

## As 30 rodadas de benchmarking

Cada rodada: o que foi estudado → o achado → o que fazer no Taskmon.
Veredito: **COPIAR** (trazer quase como está) · **ADAPTAR** (a ideia serve, a
forma não) · **EVITAR** (erro documentado) · **BASE** (fundamento, não feature).

### Bloco A — Pets virtuais e autocuidado

**01 · Finch: Self-Care Pet** — ADAPTAR
~10 M de usuários e ~US$ 30–40 M de ARR sem VC. O truque não é disciplina, é
reenquadramento: "beba água" vira "dê energia ao seu passarinho". O dever vira
cuidado. → O Taskmon já tem o pet, mas o texto das tarefas ainda é de app de
produtividade. Reescrever a voz: a tarefa não é cobrança, é o que alimenta o
Vixinho.

**02 · Finch, lado B** — EVITAR
Reclamações de 2026: features empilhadas sobre um app instável, check-in lento
(muitos toques, animações, mensagens), preço 4× maior no Android. → Cada novo
minijogo no Taskmon compra a mesma dívida. Congelar features de jogo até o elo
tarefa→economia existir.

**03 · Forest** — ADAPTAR
A árvore morre se você sair do app. A punição é *dentro da sessão*, imediata,
compreensível, e o usuário escolheu entrar nela. → Punição no Taskmon é de
madrugada, invisível, e a criança acorda com o pet pior sem entender por quê.
Punição precisa ser presenciada para ensinar.

**04 · Pokémon Sleep** — ADAPTAR com trava
Coleção (CD4) + imprevisibilidade (CD7) fazem gente mudar hábito de sono de
verdade. Mas a comunidade documentou a virada para grind e min-max. → A masmorra
já é o vetor certo de imprevisibilidade no Taskmon (drop de 💗 a 5%). Manter
pequena. Não transformar a coleção de comida em checklist obrigatório.

**05 · Tamagotchi Uni** — COPIAR
Wi-Fi, Tamaverse, visitas, presentes entre aparelhos, personalidade e hobby por
bichinho. A franquia original concluiu que pet sozinho não basta. → O
`TogetherHome` já é 40% disso. Falta presente, visita e recado entre perfis.

**06 · Efeito Tamagotchi (literatura)** — BASE
Antropomorfismo e apego parassocial ativam circuitos de cuidado reais; o luto
quando o bichinho "morre" é real. → Confirma a força do produto e proíbe o
extremo: o pet do Taskmon nunca deve morrer, e regredir de fase deve ser sempre
reversível e explicado.

### Bloco B — Hábito, streak e retenção

**07 · Duolingo — streak e streak freeze** — COPIAR
A streak é a ferramenta de retenção mais forte que existe, porque perda dói ~2×
mais que ganho equivalente. O *streak freeze* reduziu churn em 21% em quem estava
prestes a quebrar. → Criar o escudo: um item automático, 1 por semana, que anula
a perda do dia e preserva os dias perfeitos. Sem custo, sem loja.

**08 · Streak anxiety** — EVITAR
O Duo virou símbolo de culpa: notificação passivo-agressiva, animação triste.
Pesquisa mostra ansiedade, vergonha e burnout, e 40% dos adolescentes limitando
uso por saúde mental. → Nenhuma notificação do Taskmon deve dizer "seu pet está
triste porque você sumiu". Convite, nunca cobrança.

**09 · Habitica** — EVITAR (com um resgate)
Interface sobrecarregada, estética que cansa, e sobretudo o dano: perder um dia
machuca o avatar e prejudica o *party*. Gente sai por causa da espiral de culpa.
Quando o party esvazia, a motivação some junto. → Nunca criar mecânica em que a
falha de uma irmã prejudique a outra. O resgate: party ativo é genuinamente
motivador — vale como meta cooperativa, não como dano compartilhado.

**10 · Anéis do Apple Fitness** — COPIAR
Meta diária que se lê sem ler: três anéis fechando. Zero texto, estado inteiro num
relance. → Substituir/duplicar as barras do Taskmon por um anel de dia por perfil,
legível para quem não lê.

**11 · Benchmarks de retenção** — BASE
Saúde & fitness: D1 ~27%, D7 ~10%, D30 ~4%. D7 é o número diagnóstico — quem volta
no dia 7 tem 4–5× mais chance de estar ativo no dia 30. Features sociais e de
responsabilidade mútua derrubam churn mensal em 20–35%. → Para o Taskmon, o
equivalente familiar do D7 é a **terceira semana**, quando a novidade acaba. É
para lá que o roadmap deve olhar.

### Bloco C — Tarefas em família

**12 · OurHome, S'moresUp, Homey** — CONTEXTO
S'moresUp é o mais completo e o mais caro (US$ 80–96/ano). OurHome, o queridinho
gratuito, foi despublicado da Play Store em 2023 e os servidores caíram — famílias
inteiras perderam o histórico. → Argumento a favor do desenho do Taskmon: dados
locais primeiro, nuvem como cópia. Manter assim.

**13 · Greenlight e BusyKid** — ADAPTAR
Mesada real amarrada a tarefa, com revisão do pai ("done = done right"), US$ 4 a
25/mês. → O que importa não é o dinheiro, é o **elo com algo que a criança
valoriza fora do app** e a existência de uma etapa de revisão do adulto.

**14 · Concorrentes brasileiros** — CONTEXTO
Pontuei (pontos → prêmios, de mesada a passeio, planos a partir de R$ 0),
ParensUP (10 mil downloads, feito por uma família), Rotina Divertida (estrelas →
recompensas, foco em autismo, R$ 14,90/mês), Feito!, Rotininha. Todos convergem
para o mesmo formato: pontos → catálogo de prêmios do mundo real. → O mercado
PT-BR já validou a peça que falta no Taskmon. Nenhum deles tem um bicho com
vínculo emocional real — é aí que o Taskmon ganha.

**15 · Foto-prova e aprovação** — ADAPTAR com cuidado
Kid Chore, ChoreQuest e ChoreSplit (com verificação por IA) pedem foto e
aprovação, com auto-aprovação para tarefas de confiança. → Útil para "arrumei a
cama". Mas verificação por padrão sinaliza desconfiança para uma criança de 8
anos. Opcional, por tarefa, escolhida pela mãe, nunca padrão.

**16 · Loja de recompensa do mundo real** — COPIAR
Padrão consolidado: a moeda vale porque compra privilégio (escolher o filme, ficar
acordada mais tarde, um passeio), o adulto define preços e aprova o resgate, e a
recomendação é misturar prêmios de tela com prêmios fora da tela. → É a peça mais
barata e de maior impacto do roadmap. Uma lista editável + um cartão de resgate.
Zero backend.

**17 · Carga mental materna** — CRÍTICO
Mães carregam 71% da carga mental doméstica. 70% desistem de apps de tarefa em
100 dias. A socióloga Jaclyn Wong resume: "o trabalho de administrar o app
continua sendo visto como trabalho de mulher". → Toda feature nova do Taskmon
precisa passar num teste: *isso tira trabalho da mãe ou adiciona?* Cadastro de
tarefa por voz, modelos de rotina prontos e tarefas recorrentes são features de
alívio, não de enfeite.

**18 · A queda da novidade** — CRÍTICO
Crianças perdem interesse em 2–3 semanas; os pais concluem que "o app não
funcionou". Aparece o "reward fatigue": a criança começa a perguntar "o que eu
ganho?" para cada coisa. A saída documentada não é mais pontos — é **pertencimento
e contribuição**. → O Taskmon precisa de um eixo de significado ao lado do eixo de
recompensa: "a família conseguiu", "eu ajudei minha irmã", e conteúdo que se
renova sem trabalho da mãe (temporadas).

### Bloco D — Fundamentos de psicologia

**19 · Teoria da Autodeterminação** — BASE
Autonomia, competência e vínculo. Na pesquisa de mHealth com 307 usuários, os três
predizem motivação intrínseca. E o mapeamento é específico: avatar, história e
companheiros alimentam **vínculo**; badges e gráficos alimentam **competência**;
escolha significativa alimenta **autonomia**. O alerta: pontos usados como
controle corroem interesse; usados como *feedback de competência*, sustentam.
→ O Taskmon é rico em vínculo (pet), médio em competência (fases), pobre em
autonomia. O cadeado de evolução e a escolha dos dias da semana são as duas
sementes de autonomia que já existem — promover as duas.

**20 · Efeito de sobrejustificação** — GUARDRAIL
Recompensa esperada por atividade já prazerosa reduz o interesse. Mas: quando a
tarefa é desagradável e a motivação intrínseca é insuficiente — o caso das tarefas
domésticas — a recompensa extrínseca é útil e apropriada. → Separar dois tipos de
tarefa no Taskmon: **Dever** (rende Bits) e **Meu jeito** (rende história, fala do
pet, celebração — nunca moeda).

**21 · Economia de fichas (ABA)** — COPIAR
Uma das intervenções mais estudadas em análise do comportamento; recomendada por
AAP e CDC. Requisitos: comportamento definido com especificidade, ficha entregue
imediatamente, acúmulo visível, ficha que não seja reforçadora por si só, e **plano
de desmame** — "as habilidades duram depois que as fichas param?" → O Taskmon
acerta em acúmulo visível e erra em três: a tarefa é texto livre (sem
especificidade), a entrega não é imediata nem enfática, e não existe desmame.

**22 · Modelo de Fogg (B = MAP) e Tiny Habits** — COPIAR
Comportamento = Motivação × Habilidade × Estímulo; se qualquer um for zero, não
acontece. A receita: *depois de [âncora], eu faço [comportamento mínimo], então
[celebração]*. "Emoções criam hábitos". → Três aplicações diretas: âncora (tarefa
ligada a um momento do dia, não a um horário no relógio, que a criança de 4 anos
não lê), habilidade (permitir a versão mínima — "guardei um brinquedo" conta) e
celebração (ver U3).

**23 · Disciplina positiva e elogio ao processo** — CRÍTICO
Consequência natural ensina; punição gera evitação. Elogio ao processo ("você se
esforçou muito") aos 1–3 anos prediz mentalidade de crescimento aos 7 e desempenho
escolar aos 9. Elogio à pessoa ("você é inteligente") faz o oposto. → As falas do
pet são o canal perfeito e já existem. Regra de escrita: o pet comenta o
**esforço e a estratégia**, nunca o atributo da criança. E nunca comenta a falha.

**24 · Gradiente de meta, progresso dotado, Zeigarnik** — COPIAR
As pessoas aceleram perto do fim; começar com progresso de graça (dois selos em
vez de zero) aumenta a conclusão; tarefa inacabada fica na cabeça. → O Taskmon
mostra "2/3 tarefas". Melhor: barra que já começa parcialmente cheia por ter
aparecido, e destaque visual crescente na última tarefa do dia.

**25 · Octalysis** — DIAGNÓSTICO
Oito drives; os de cima (Significado, Realização, Criatividade) são *white hat* —
poder e orgulho, sem urgência; os de baixo (Escassez, Imprevisibilidade, Perda)
são *black hat* — urgência e ansiedade. → Mapa do Taskmon: CD4 e CD8 fortes, CD2
médio, CD1/CD3/CD5 quase ausentes. Todo o roadmap abaixo é, em resumo, uma
migração de peso do black hat para o white hat.

### Bloco E — Crianças, UX e ética

**26 · Desenvolvimento aos 4–8** — CRÍTICO
Controle inibitório, memória de trabalho e flexibilidade cognitiva ainda em
desenvolvimento; percepção de intervalos de tempo continua amadurecendo até bem
depois dos 7. Cronogramas visuais reduzem estresse e aumentam autonomia. → Uma
menina de 4 e uma de 8 não podem usar a mesma interface. A de 4 precisa de rotina
visual em imagens e de zero relógio; a de 8 aguenta metas e escolha de dias.

**27 · UX infantil (NN/g)** — COPIAR
Segmentar em faixas estreitas (3–5, 6–8, 9–12); alvo de 2 × 2 cm com folga;
símbolo antes de texto para os menores; instruções claras e específicas; evitar
arrastar e rolagem complexa. → Modo por perfil, não configuração global — os três
perfis do Taskmon já são o lugar natural para isso.

**28 · Pré-leitores** — COPIAR
Narração em áudio e destaque palavra a palavra são o padrão para quem ainda não
lê. → O `speak()` já está no app para as falas do pet. Reaproveitar: botão 🔊 em
cada tarefa, e leitura automática da tarefa do dia no modo pré-leitor. É a feature
de melhor razão impacto/esforço do dossiê.

**29 · Rivalidade entre irmãs** — CRÍTICO
Rivalidade nasce de injustiça percebida. Justo ≠ igual: recompensa proporcional à
idade e à capacidade é o que sustenta a percepção de justiça. Em sala de aula,
leaderboard aumenta engajamento *e* desconforto — e a saída documentada foi migrar
para atividades em equipe. Ranking público pode virar bullying. → **Nunca colocar
ranking entre as três.** O Taskmon já acerta por acaso ao ter metas por fase
(cada uma na sua régua). Cooperação é o vetor social correto aqui: meta somada da
família, presente de uma para a outra, carinho recíproco.

**30 · Ética e regulação em 2026** — CRÍTICO
O AADC da Califórnia define *dark pattern* incluindo "recompensas por tempo gasto"
e notificações desenhadas para estender o uso infantil. Nova Jersey e Carolina do
Sul aprovaram códigos próprios em 2026. **O Brasil proíbe loot box para menores a
partir de 2026.** UNICEF publicou o brief sobre companheiros de IA e direitos da
criança; a SB 243 da Califórnia entrou em vigor em 1º/1/2026. → Três linhas
vermelhas para o Taskmon: nada de caixa aleatória paga, nada de recompensa por
tempo de tela dentro do app, e o chat de IA precisa de escopo fechado e de estar
desligado por padrão nos perfis infantis.

---

## Roadmap priorizado

### Agora — 2 semanas, tudo no cliente

| # | Mudança | Por quê | Esforço |
|---|---|---|---|
| 1 | **Tarefa dá Bits.** Cada tarefa concluída rende Bits direto. | Corrige o incentivo invertido (P1, G3) | P |
| 2 | **Teto diário de Bits do minijogo escala com tarefas.** Ex.: `20 + 30 × tarefas do dia`. | Minijogo vira recompensa da tarefa, não substituto | P |
| 3 | **Loja de recompensa real.** Lista editável pela mãe ("escolher a pizza — 200 Bits"), resgate gera cartão pra mostrar. | O *backup reinforcer* que falta (P2, R16) | M |
| 4 | **Escudo semanal automático.** 1/semana, anula perda de coração e preserva dias perfeitos. | −21% de churn no equivalente do Duolingo (G2) | P |
| 5 | **Fim da regressão automática.** HP 0 → "modo dorminhoco" (pet dorme, não regride). Regressão só com confirmação do adulto. | Punição desproporcional à idade (P3, P5) | P |
| 6 | **Sem tarefa cadastrada, sem punição.** Dia sem tarefa não tira coração nem dia perfeito. | Pune a agenda do adulto, não a criança (P3) | P |
| 7 | **Juice na conclusão.** Confete, som, o pet corre até a tarefa, Bits voando. | Celebração é o que fixa o hábito (U3, R22) | M |
| 8 | **Botão 🔊 na tarefa.** Reaproveitar o `speak()`. | Pré-leitora de 4 anos (U1, R28) | P |

### Próximo — 1 a 2 meses

| # | Mudança | Por quê | Esforço |
|---|---|---|---|
| 9 | **Casinha da Mãe.** 5ª casinha com PIN de 4 dígitos: cadastra tarefa em qualquer perfil, aprova resgate, vê o painel da semana. | O papel que não existe (Pr1, R17) | G |
| 10 | **Meta familiar cooperativa.** Soma das três por semana → destrava cenário/evento de sábado. Nunca ranking. | CD1 + CD5, e o vetor social seguro (G1, R29) | M |
| 11 | **Carinho recíproco no TogetherHome.** Uma irmã cuida do pet da outra e isso conta. | Metade já existe; é o gesto de vínculo mais barato (R05) | P |
| 12 | **Modo por faixa etária, por perfil.** Pré-leitor: ícone grande, alvo ≥75 px, um idioma, sem texto secundário. | NN/g, e os perfis já são o lugar (U1, U2, R26, R27) | M |
| 13 | **Contenção do chat de IA.** Repertório fechado em vez de geração livre, sem memória emocional, sem linguagem de amizade exclusiva, desligado por padrão nos perfis infantis. | Maior risco do produto em 2026 (Pr5, R30) | M |
| 14 | **Painel "Semana da família".** Cinco números, uma tela. | Sem isso não dá pra saber se funcionou (Pr3) | M |
| 15 | **Tarefas: modelos e recorrência.** Biblioteca de rotinas prontas por idade + repetição. | Tira trabalho da mãe (R17) | M |
| 16 | **Anel do dia.** Estado do dia legível sem ler. | R10, U1 | P |

### Depois — trimestre

| # | Mudança | Por quê | Esforço |
|---|---|---|---|
| 17 | **Merge de nuvem por perfil.** Timestamp por perfil em vez de blob last-write-wins. | Destrava um aparelho por pessoa (Pr2) | G |
| 18 | **Temporadas de 6 semanas.** Um cenário, uma sombra, uma comida e um objetivo coletivo novos. | Combate a queda da novidade (G4, R18) | G |
| 19 | **Dois tipos de tarefa: Dever e Meu jeito.** Dever rende Bits; Meu jeito rende história e fala do pet. | Guardrail de sobrejustificação (P4, R20) | M |
| 20 | **Desmame na fase 3.** A razão tarefa→Bits cai e entra "contribuição": tarefas de ajudar alguém valem história. | O plano de fading que a economia de fichas exige (R21, R18) | M |
| 21 | **Foto-prova opcional.** Por tarefa, escolhida pela mãe, com auto-aprovação padrão. | R15 | M |

---

## Armadilhas — o que não fazer

- **Ranking entre as irmãs.** Idades diferentes, réguas diferentes; ranking
  fabrica injustiça percebida, que é a raiz da rivalidade.
- **Caixa aleatória paga.** Além do dano documentado, o Brasil proíbe loot box
  para menores a partir de 2026.
- **Recompensar tempo de tela dentro do app.** É literalmente o exemplo de *dark
  pattern* no código da Califórnia.
- **Notificação culpada.** "Seu pet está triste porque você sumiu" é o padrão que
  transformou o Duo em meme de ansiedade.
- **Deixar o pet morrer.** O apego é real; a perda também.
- **Pagar Bits por algo que a criança já ama fazer.** É onde a sobrejustificação
  cobra o preço.
- **O 8º minijogo antes do elo tarefa→economia.** É o erro que os usuários estão
  apontando no Finch em 2026.

---

## Como medir (cinco números)

1. **Tarefas reais concluídas por semana, por perfil.** O número que importa.
2. **% de dias com ≥1 tarefa** — não a streak perfeita. Consistência, não perfeição.
3. **Bits de minijogo ÷ Bits de tarefa.** Guardrail do incentivo. Alvo: < 1.
4. **Tarefas cadastradas pela mãe por semana.** Proxy de carga materna — quer que
   *caia* com o tempo (modelos e recorrência assumindo o trabalho).
5. **Resgates de recompensa real por mês.** Prova de que a moeda vale algo.

E um marco qualitativo: **a semana 3**. É quando a novidade acaba na literatura.
Se as três continuarem abrindo o app na semana 4, o desenho está certo.

---

## Fontes

Pets e autocuidado: [Deconstructor of Fun sobre o Finch](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl) · [Finch a US$ 30M ARR](https://blog.sparrowapps.io/p/finch-how-a-self-care-app-hit-30m-arr-without-vc-money) · [Koi — a ascensão do self-care pet](https://koi-calm.app/blog/self-care-pet-apps) · [Críticas ao Finch em 2026](https://habitbox.app/blog/finch-app-review) · [Forest e gamificação](https://trophy.so/blog/forest-gamification-case-study) · [Pokémon Sleep: quão longe é longe demais](https://www.marygeorgescu.com/blog/2025/7/12/how-far-is-too-far-evaluating-pokmon-sleeps-design-tracking-and-monetization) · [Tamagotchi Uni](https://tamagotchi.fandom.com/wiki/Tamagotchi_Uni) · [Efeito Tamagotchi](https://en.wikipedia.org/wiki/Tamagotchi_effect) · [Revisão narrativa sobre pets virtuais](https://www.sciencedirect.com/science/article/pii/S1875952125000382)

Hábito e streak: [Psicologia da streak do Duolingo](https://www.justanotherpm.com/blog/the-psychology-behind-duolingo-streak-feature) · [Streak design sem burnout — Yu-kai Chou](https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/) · [Quando streaks saem pela culatra](https://blog.cohorty.app/the-psychology-of-streaks-why-they-work-and-when-they-backfire/) · [Habitica: estudo de caso](https://trophy.so/blog/habitica-gamification-case-study) · [Alternativas ao Habitica: por que as pessoas saem](https://habithuddle.com/blog/habitica-alternatives) · [Benchmarks D1/D7/D30 2026](https://vmobify.com/blog/app-retention-benchmarks)

Família e tarefas: [Melhores apps de tarefa 2026](https://www.pointwisesystem.com/blog/best-chore-apps-for-kids-2026) · [Alternativas ao OurHome](https://getsense.ai/blog/posts/best-ourhome-alternatives-2025) · [Greenlight vs BusyKid](https://www.creditdonkey.com/greenlight_busykid.html) · [Pontuei](https://www.pontuei.app.br) · [ParensUP](https://parensup.com/pt) · [Rotina Divertida](https://www.rotinadivertida.com.br/) · [Apps de rotina familiar no Brasil (TechTudo)](https://www.techtudo.com.br/listas/2023/08/quer-organizar-a-rotina-da-familia-esses-5-apps-podem-ajudar-edapps.ghtml) · [Por que apps de tarefa falham / carga mental](https://www.nestifyapp.org/blog/why-chore-apps-fail-proactive-ai-solution) · [A carga invisível das mães (Frontiers)](https://www.frontiersin.org/journals/sociology/articles/10.3389/fsoc.2025.1683261/full) · [Recompensas do mundo real](https://www.tasksnchores.com/reward-systems-for-kids-stars-points-screen-time-or-money/)

Psicologia: [SDT — guia Deci & Ryan](https://yukaichou.com/gamification-analysis/self-determination-theory-guide-to-ryan-and-decis-motivation-framework/) · [Autonomia, vínculo e competência em UX (NN/g)](https://www.nngroup.com/articles/autonomy-relatedness-competence/) · [Gamificação e satisfação de necessidades psicológicas](https://www.sciencedirect.com/science/article/pii/S074756321630855X) · [Efeito de sobrejustificação](https://en.wikipedia.org/wiki/Overjustification_effect) · [Efeitos negativos de recompensas extrínsecas (USC)](https://ceo.usc.edu/wp-content/uploads/2013/02/2013-05-G13-05-624-Negative_Effects_of_Extrinsic_Rewards.pdf) · [Economia de fichas em ABA](https://www.apexaba.com/blog/token-economy) · [Tiny Habits / modelo de Fogg](https://www.easyhabits.io/blog/tiny-habits-bj-fogg) · [Disciplina positiva](https://www.positivediscipline.com/about-positive-discipline/) · [Elogio ao processo e persistência](https://www.sciencedirect.com/science/article/abs/pii/S0022096524001723) · [Efeito de gradiente de meta](https://www.coglode.com/research/goal-gradient-effect) · [Octalysis](https://yukaichou.com/gamification-examples/octalysis-gamification-framework/)

Crianças, UX e ética: [UX para crianças 3–12 (NN/g)](https://www.nngroup.com/reports/children-on-the-web/) · [Design por estágio de desenvolvimento físico (NN/g)](https://www.nngroup.com/articles/children-ux-physical-development/) · [Considerações cognitivas (NN/g)](https://www.nngroup.com/articles/kids-cognition/) · [Cronogramas visuais](https://www.biermanautism.com/resources/blog/visualschedules/) · [Goally](https://getgoally.com/goally-therapy-suite/visual-schedule-app/) · [Rivalidade entre irmãos (Cleveland Clinic)](https://health.clevelandclinic.org/sibling-rivalry) · [Leaderboards em ambiente educacional](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8097522/) · [AADC e design centrado na criança (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3585088.3589370) · [Privacidade infantil em 2026 (Loeb & Loeb)](https://www.loeb.com/en/insights/publications/2026/06/childrens-online-privacy-2026-state-app-store-design-code-and-social-media-laws) · [UNICEF — Quando a IA vira amiga](https://www.unicef.org/documents/when-ai-becomes-friend-child-rights-risks) · [Loot boxes e regulação em 2026](https://programminginsider.com/loot-boxes-regulation-and-where-the-line-sits-in-2026/) · [AAP: recomendações de tela em 2026](https://health.choc.org/updated-aap-recommendations-for-screen-time/) · [Game feel e juice](https://www.designthegame.com/learning/tutorial/how-tactile-interactions-game-juice-drive-player-engagement)
