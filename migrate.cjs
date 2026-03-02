const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');

// Extract CSS
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  fs.mkdirSync('frontend', { recursive: true });
  fs.writeFileSync('frontend/index.css', styleMatch[1]);
}

let bodyMatch = html.match(/<main class="main-content" id="main-content">([\s\S]*?)<\/main>/);
let sidebarMatch = html.match(/<aside class="sidebar" id="sidebar">([\s\S]*?)<\/aside>/);

function htmlToJsx(str) {
  return str
    .replace(/class="/g, 'className="')
    .replace(/for="/g, 'htmlFor="')
    .replace(/stroke-width="/g, 'strokeWidth="')
    .replace(/style="([^"]*)"/g, (match, p1) => {
      // Very basic style conversion for single static styles used in this app
      if (p1.includes('background:var(--accent);color:white;width:32px;height:32px;min-width:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;')) {
        return "style={{background:'var(--accent)',color:'white',width:'32px',height:'32px',minWidth:'32px',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'600'}}";
      }
      if (p1 === 'display: none;') return 'style={{display: "none"}}';
      return match;
    })
    .replace(/<input([^>]*[^\/])>/g, '<input$1 />')
    .replace(/<img([^>]*[^\/])>/g, '<img$1 />')
    .replace(/<br>/g, '<br />')
    .replace(/<hr>/g, '<hr />')
    .replace(/<rect([^>]*[^\/])>/g, '<rect$1 />')
    .replace(/<circle([^>]*[^\/])>/g, '<circle$1 />')
    .replace(/<line([^>]*[^\/])>/g, '<line$1 />')
    .replace(/<path([^>]*[^\/])>/g, '<path$1 />')
    .replace(/<polyline([^>]*[^\/])>/g, '<polyline$1 />');
}

fs.writeFileSync('frontend/ChatLayout.jsx', `import React from 'react';
export default function ChatLayout() {
  return (
    <>
      <div className="sidebar-overlay" id="sidebar-overlay"></div>
      <aside className="sidebar" id="sidebar">
        ${htmlToJsx(sidebarMatch[1])}
      </aside>
      <main className="main-content" id="main-content">
        ${htmlToJsx(bodyMatch[1])}
      </main>
    </>
  );
}
`);
console.log("Done");
