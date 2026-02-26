# Usar nginx leve
FROM nginx:alpine

# Remover configuração padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar todos os ficheiros do repositório para o nginx
COPY . /usr/share/nginx/html

# Expor a porta padrão do nginx
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
