#!/bin/bash

set -euxo pipefail

name="$1"


# Configure nginx
cat > "/etc/nginx/sites-available/$name" << EOF
server {                           
    listen 80;                     
    listen [::]:80;                
    server_name _;                 
                                   
    location / {              
        root /var/www/zwhitchcox.dev;       
        index index.html;          
                                   
        try_files \$uri \$uri/ /index.html;
    }                              
                                   
    location /whisper-asr {        
        root /var/www;             
        index index.html;          
                                   
        add_header Cross-Origin-Opener-Policy same-origin;
        add_header Cross-Origin-Embedder-Policy require-corp;
                                   
        try_files \$uri \$uri/ /index.html;              
    }                              
}
EOF

ln -s /etc/nginx/sites-available/$name /etc/nginx/sites-enabled/$name
rm /etc/nginx/sites-enabled/default

# Restart nginx
systemctl restart nginx

