# Portfólio Bruna Castro

Site estático em HTML, CSS e JavaScript puro, isolado na pasta `/bruna`.

## Como abrir localmente

Abra `bruna/index.html` diretamente no navegador ou use um servidor local na raiz do projeto:

```bash
python -m http.server 5177
```

Acesse `http://127.0.0.1:5177/bruna/`.

## Como trocar imagens

Substitua os arquivos em `bruna/assets/` mantendo os mesmos nomes:

- `bruna-castro-capa.png`
- `campo-background.jpg`
- `bruna-contato-verso.png`
- `favicon.png`

## Como alterar telefone e e-mail

Atualize os dados em:

- `bruna/index.html`, nos links e textos de contato.
- `bruna/script.js`, nas constantes `phone` e `email`.
- `bruna/bruna-castro.vcf`, nos campos `TEL` e `EMAIL`.

## Como incorporar ao projeto atual

Mantenha a pasta `bruna` na raiz do projeto estático da Wolf Pecuária. O Render servirá a rota automaticamente como `/bruna/`.

## Como publicar no Render

O projeto principal já possui `render.yaml` com `runtime: static` e `staticPublishPath: .`. Após commit e push para o branch configurado, o Render publica automaticamente.

## Como acessar

Após o deploy:

`https://wolf-pecuaria.onrender.com/bruna/`

## Como testar WhatsApp e e-mail

- Clique em `Fale comigo` ou `Conversar pelo WhatsApp`.
- Preencha o formulário de contato e envie.
- Clique em `Enviar e-mail`.
- Clique em `Salvar contato` para baixar `bruna-castro.vcf`.
