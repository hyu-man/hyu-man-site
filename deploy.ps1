Copy-Item .\index.html .\public\index.html -Force
npx.cmd wrangler deploy --name hyu-man
