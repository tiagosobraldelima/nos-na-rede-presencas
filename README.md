# Dashboard de Presenças - Projeto Nós na Rede

Dashboard institucional estático desenvolvido para o controle de presenças e análise do risco de não certificação dos cursistas do Projeto Nós na Rede.

Este dashboard consome diretamente a planilha oficial do Google Sheets do projeto, sem necessitar de backend próprio.

## Tecnologias

*   HTML5 semântico
*   CSS Vanilla com variáveis nativas e tipografia do Google Fonts
*   JavaScript ES Modules (`type="module"`)
*   [Chart.js](https://www.chartjs.org/) para gráficos interativos
*   [jsPDF](https://github.com/parallax/jsPDF) e [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) para exportação de PDFs
*   [SheetJS (xlsx)](https://sheetjs.com/) para exportação Excel (XLSX) e CSV
*   [FontAwesome](https://fontawesome.com/) para ícones

## Funcionalidades

1.  **Consumo Direto do Google Sheets:** Os dados são lidos em tempo real da URL pública no formato CSV, com cache-busting automático. O carregamento é refeito a cada minuto (ou quando o usuário foca na aba).
2.  **Indicadores e Resumo Textual:** O dashboard calcula e exibe rapidamente o total de estudantes válidos no filtro atual e a porcentagem apta ou com risco de perder a certificação. O resumo textual interpreta esses indicadores para o usuário de forma clara.
3.  **Filtros Combinados:** Permite recortes por turma, município, educador, encontro e situação. Atualiza todos os gráficos, KPIs e tabelas de forma síncrona.
4.  **Gráficos Analíticos:** Exibe análise situacional da certificação, presenças versus faltas por encontro e distribuição de engajamento por pólos (município/turma).
5.  **Atenção Prioritária (Risco de Evasão/Não Certificação):** Destaca os cursistas que já não conseguem alcançar a presença mínima, bem como aqueles que precisam não faltar aos próximos encontros para conseguir o certificado.
6.  **Exportação:** Exporta os dados filtrados em formato PDF, CSV ou XLSX, tanto para a base analítica completa quanto para a lista restrita de alunos em risco.

## Regras de Negócio e "Dispensa Automática"

As presenças do dashboard obedecem às seguintes regras do Projeto Nós na Rede:

1.  A carga horária total é de 120 horas (90h EaD + 30h presenciais).
2.  Os encontros presenciais somam 5 dias. Cada encontro é composto por 2 períodos (turnos), totalizando **10 períodos**.
3.  A certificação exige o mínimo de 75% de frequência no ciclo presencial. Isso equivale a estar presente em pelo menos **7 dos 10 períodos**.
4.  **Dispensa do 1º Encontro:** Cursistas que não tiverem *nenhum registro* contabilizado para o 1º encontro (períodos 1 e 2 em branco) receberão uma **dispensa automática** em prol da mitigação de riscos atípicos do início do projeto. Tais períodos serão computados e somados como se fossem presenças para o cálculo de atingimento dos 7 períodos mínimos.
5.  Demais ausências ou encontros futuros em branco são tratados como "Sem Registro", enquanto não forem atestados ou justificados.

## Executando localmente

Como o projeto não possui *build step* (sem NPM, sem Webpack, sem Vite), você precisa de um servidor HTTP local simples para contornar bloqueios de CORS (origin null) de `import` local do ES6 e permitir acesso ao CSV externo.

Você pode usar o [Live Server do VSCode](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) ou Python:

```bash
# Navegue até a pasta do projeto e inicie o servidor Python 3
python3 -m http.server 8000
```

Abra `http://localhost:8000` no seu navegador.

## Deploy

O deploy é automatizado através do **GitHub Actions**. Qualquer _push_ para a branch principal (`main`) dispara a ação em `.github/workflows/static.yml` e envia os arquivos para o GitHub Pages.
