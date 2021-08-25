import { serve, ServerRequest } from "https://deno.land/std@0.89.0/http/server.ts";
import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";

const s = serve({ port: 8000 });
console.log("http://localhost:8000/");
const decoder = new TextDecoder("utf-8");

const htmlnize = (content:string, meta:any):string =>{
    const header:string = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title> ${meta["title"]} </title>
            <link rel="stylesheet" type="text/css" href="github-markdown.css">
            <!-- katex -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css" integrity="sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq" crossorigin="anonymous">
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.js" integrity="sha384-y23I5Q6l+B6vatafAwxRu/0oK/79VlbSz7Q9aiSZUvyWYIYsd+qj+o24G5ZU2zJz" crossorigin="anonymous"></script>
            <!-- Automatically render math in text elements -->
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/contrib/auto-render.min.js" integrity="sha384-kWPLUVMOks5AQFrykwIup5lo0m3iMkkHrD0uJ4H5cjeGihAutqP0yW0J6dpFiVkI" crossorigin="anonymous"></script>
            <script>
            document.addEventListener("DOMContentLoaded", function() {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "$", right: "$", display: false},
                ]
              });
            });
            </script>
            <!-- mermaid -->
            <link rel="stylesheet" href="https://unpkg.com/mermaid/dist/mermaid.min.css">
            <script src="https://unpkg.com/mermaid/dist/mermaid.min.js"></script>
            <script>mermaid.initialize({startOnLoad:true});</script>
        </head>
        <body>
        `;
    const footer:string = `
        </body>
        </html>
        `;
    const html:string = header + content.replace("lang-mermaid", "mermaid") + footer;

    return html;
}

const markdown = (file:string):string =>{
    const markup = Marked.parse(file);
    const html:string = htmlnize(markup.content, markup.meta);

    return html;
}


for await (const req of s) {
    const filepath:string = `${req.url.slice(1)}`; //remove root of path
    const dots:string[] = filepath.split(".");
    const ext:string = dots[dots.length - 1];

    if (["", "/", "index", "index.html", "index.md"].includes(filepath)){
        const file = decoder.decode(await Deno.readFile("index.md"));
        req.respond({ body: markdown(file) });
        continue;
    }
    
    try{
        const file = decoder.decode(await Deno.readFile(filepath));
        switch(ext){
            case "md":
                req.respond({ body: markdown(file) });
                break;
            default:
                req.respond({ body: file });
                break;
        }
    }catch(e){
        console.log(`error: ${e}`)
        req.respond({ body: "404 not found" });
    }
}

