# FotoVault

Ferramenta estática para organizar fotografias pessoais que o utilizador já exportou ou consegue ver com autorização.

## O que faz

- identifica localmente a plataforma a partir de um URL de perfil;
- permite abrir/descarregar um URL direto de uma imagem pública;
- encaminha para os canais oficiais de exportação do Facebook/Meta, Instagram e TikTok;
- permite selecionar ou arrastar fotografias exportadas;
- descarrega os ficheiros escolhidos diretamente no navegador;
- não tem servidor de upload, base de dados, campos de palavra-passe ou recolha de códigos.

## Limite importante

Um site GitHub Pages é uma aplicação estática. Não deve tentar contornar perfis bloqueados, privacidade ou autenticação de terceiros. Um link de perfil, por si só, não autoriza a obtenção de fotografias restritas. Para fotografias próprias, usa a sessão oficial da plataforma ou o ficheiro de exportação oficial e importa os ficheiros nesta página.

## Publicar

1. Ativa **Settings → Pages** no GitHub.
2. Escolhe a branch `main` e a pasta `/ (root)`.
3. Guarda e abre o endereço fornecido pelo GitHub Pages.

O site não necessita de build, Node.js ou variáveis secretas.

Quando é usado um link de perfil, a página apenas identifica a plataforma. Para descarregar uma pré-visualização pública, cola o endereço direto do ficheiro JPG/PNG/WEBP obtido na própria página ou através da opção oficial de guardar a imagem. Um link de perfil restrito, sem sessão ou sem autorização, não fornece um ficheiro que o site possa descarregar legitimamente.
